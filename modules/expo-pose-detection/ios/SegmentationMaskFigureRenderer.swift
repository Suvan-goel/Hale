import CoreGraphics
import Foundation
import MediaPipeTasksVision
import QuartzCore
import UIKit

private let maskDownsampleStride = 2
private let maskVisibleStart: Float = 0.30
private let maskVisibleFull: Float = 0.75
private let maskAttackAlpha: Float = 0.50
private let maskReleaseAlpha: Float = 0.30
private let maskMaxAlpha: Float = 82
private let maxExtractionFailures = 3
private let rasterBufferCount = 3

struct SegmentationMaskFrameDiagnostics {
  let extractionMs: Double
  let rasterMs: Double
  let postprocessMs: Double
  let dataType: String
  let sourceWidth: Int
  let sourceHeight: Int
  let rasterWidth: Int
  let rasterHeight: Int
}

enum SegmentationMaskRenderContent {
  case image(CGImage)
  case hidden
  case unavailable(String)
}

struct SegmentationMaskRenderResult {
  let content: SegmentationMaskRenderContent
  let diagnostics: SegmentationMaskFrameDiagnostics

  static func hidden(dataType: String = "none") -> SegmentationMaskRenderResult {
    SegmentationMaskRenderResult(
      content: .hidden,
      diagnostics: SegmentationMaskFrameDiagnostics(
        extractionMs: 0,
        rasterMs: 0,
        postprocessMs: 0,
        dataType: dataType,
        sourceWidth: 0,
        sourceHeight: 0,
        rasterWidth: 0,
        rasterHeight: 0))
  }
}

/**
 * A reusable Core Graphics backing store. `makeImage()` gives the published
 * frame snapshot semantics (Core Graphics uses copy-on-write when this store
 * is touched again), while avoiding a new Swift byte array, Data copy, and
 * colour-space construction on every camera frame.
 */
private final class MaskRasterBuffer {
  let context: CGContext

  init?(width: Int, height: Int, colorSpace: CGColorSpace) {
    guard let context = CGContext(
      data: nil,
      width: width,
      height: height,
      bitsPerComponent: 8,
      bytesPerRow: width * 4,
      space: colorSpace,
      bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue).rawValue)
    else { return nil }
    self.context = context
  }
}

/**
 * Builds a privacy-preserving tinted matte from MediaPipe's person mask.
 * Camera pixels never enter the output: each pixel is only the configured RGB
 * tint plus a confidence-derived alpha. A per-pixel asymmetric EMA and 2x
 * downsample keep the contour calm instead of shimmering in domestic light.
 */
final class SegmentationMaskFigureRenderer {
  private let lock = NSLock()
  private let colorSpace = CGColorSpaceCreateDeviceRGB()
  private var rasterBuffers: [MaskRasterBuffer] = []
  private var nextRasterBufferIndex = 0
  private var smoothed: [Float] = []
  private var maskWidth = 0
  private var maskHeight = 0
  private var tintRed: UInt8 = 0x8E
  private var tintGreen: UInt8 = 0x31
  private var tintBlue: UInt8 = 0x58
  private var extractionFailures = 0
  private var unavailableReported = false

  func setColor(_ color: UIColor) {
    var red: CGFloat = 0
    var green: CGFloat = 0
    var blue: CGFloat = 0
    var alpha: CGFloat = 0
    guard color.getRed(&red, green: &green, blue: &blue, alpha: &alpha) else { return }
    lock.lock()
    tintRed = UInt8((red * 255).rounded().clamped(to: 0...255))
    tintGreen = UInt8((green * 255).rounded().clamped(to: 0...255))
    tintBlue = UInt8((blue * 255).rounded().clamped(to: 0...255))
    lock.unlock()
  }

  func render(mask: Mask?, collectDiagnostics: Bool) -> SegmentationMaskRenderResult {
    lock.lock()
    defer { lock.unlock() }

    guard extractionFailures < maxExtractionFailures else {
      return .hidden(dataType: "disabled")
    }
    // A single MediaPipe result can omit its optional mask while pose tracking
    // remains valid. Hide for that frame; only a real extraction/image failure
    // should permanently disable the visual fallback.
    guard let mask, mask.width > 0, mask.height > 0 else { return .hidden() }

    let postprocessStartMs = collectDiagnostics ? nowMs() : 0
    let downWidth = max(1, mask.width / maskDownsampleStride)
    let downHeight = max(1, mask.height / maskDownsampleStride)
    guard ensureBuffers(width: downWidth, height: downHeight) else {
      return recordExtractionFailure(
        "segmentation raster allocation failed",
        diagnostics: diagnostics(
          collect: collectDiagnostics,
          startMs: postprocessStartMs,
          extractionEndMs: postprocessStartMs,
          rasterEndMs: collectDiagnostics ? nowMs() : 0,
          dataType: "unknown",
          sourceWidth: mask.width,
          sourceHeight: mask.height,
          rasterWidth: downWidth,
          rasterHeight: downHeight))
    }

    // Access the mask in its native storage type. Asking MediaPipe for the
    // other pointer triggers an expensive one-time full-mask conversion.
    let sourceIsUInt8 = mask.dataType.rawValue == 0
    let sourceUInt8: UnsafePointer<UInt8>? = sourceIsUInt8 ? mask.uint8Data : nil
    let sourceFloat32: UnsafePointer<Float>? = sourceIsUInt8 ? nil : mask.float32Data
    let dataType = sourceIsUInt8 ? "uint8" : "float32"
    let extractionEndMs = collectDiagnostics ? nowMs() : 0

    let rasterBuffer = rasterBuffers[nextRasterBufferIndex]
    nextRasterBufferIndex = (nextRasterBufferIndex + 1) % rasterBuffers.count
    guard let rawPixels = rasterBuffer.context.data else {
      return recordExtractionFailure(
        "segmentation raster bytes unavailable",
        diagnostics: diagnostics(
          collect: collectDiagnostics,
          startMs: postprocessStartMs,
          extractionEndMs: extractionEndMs,
          rasterEndMs: collectDiagnostics ? nowMs() : 0,
          dataType: dataType,
          sourceWidth: mask.width,
          sourceHeight: mask.height,
          rasterWidth: downWidth,
          rasterHeight: downHeight))
    }
    let pixels = rawPixels.assumingMemoryBound(to: UInt8.self)
    let red = tintRed
    let green = tintGreen
    let blue = tintBlue
    var anyVisible = false
    var targetIndex = 0

    for y in 0..<downHeight {
      let sourceY = min(mask.height - 1, y * maskDownsampleStride)
      for x in 0..<downWidth {
        let sourceX = min(mask.width - 1, x * maskDownsampleStride)
        let sourceIndex = sourceY * mask.width + sourceX
        let raw = sourceIsUInt8
          ? Float(sourceUInt8![sourceIndex]) / 255
          : sourceFloat32![sourceIndex]
        let target = raw.clamped(to: 0...1)
        let current = smoothed[targetIndex]
        let smoothing = target > current ? maskAttackAlpha : maskReleaseAlpha
        let next = current + (target - current) * smoothing
        smoothed[targetIndex] = next
        let fraction = segmentationMaskFigureAlphaFraction(next)
        let alpha = UInt8((fraction * maskMaxAlpha).rounded().clamped(to: 0...255))
        let pixelIndex = targetIndex * 4
        if alpha > 0 {
          anyVisible = true
          pixels[pixelIndex] = premultiply(red, alpha: alpha)
          pixels[pixelIndex + 1] = premultiply(green, alpha: alpha)
          pixels[pixelIndex + 2] = premultiply(blue, alpha: alpha)
          pixels[pixelIndex + 3] = alpha
        } else {
          pixels[pixelIndex] = 0
          pixels[pixelIndex + 1] = 0
          pixels[pixelIndex + 2] = 0
          pixels[pixelIndex + 3] = 0
        }
        targetIndex += 1
      }
    }

    let rasterEndBeforeImageMs = collectDiagnostics ? nowMs() : 0
    let frameDiagnostics = diagnostics(
      collect: collectDiagnostics,
      startMs: postprocessStartMs,
      extractionEndMs: extractionEndMs,
      rasterEndMs: rasterEndBeforeImageMs,
      dataType: dataType,
      sourceWidth: mask.width,
      sourceHeight: mask.height,
      rasterWidth: downWidth,
      rasterHeight: downHeight)
    guard anyVisible else {
      extractionFailures = 0
      return SegmentationMaskRenderResult(content: .hidden, diagnostics: frameDiagnostics)
    }
    guard let image = rasterBuffer.context.makeImage() else {
      return recordExtractionFailure("segmentation image creation failed", diagnostics: frameDiagnostics)
    }
    let completedDiagnostics = diagnostics(
      collect: collectDiagnostics,
      startMs: postprocessStartMs,
      extractionEndMs: extractionEndMs,
      rasterEndMs: collectDiagnostics ? nowMs() : 0,
      dataType: dataType,
      sourceWidth: mask.width,
      sourceHeight: mask.height,
      rasterWidth: downWidth,
      rasterHeight: downHeight)
    extractionFailures = 0
    return SegmentationMaskRenderResult(content: .image(image), diagnostics: completedDiagnostics)
  }

  /** Subject gone: remove the matte immediately rather than leaving a ghost. */
  func clearSubject() {
    lock.lock()
    for index in smoothed.indices { smoothed[index] = 0 }
    lock.unlock()
  }

  private func ensureBuffers(width: Int, height: Int) -> Bool {
    if width == maskWidth, height == maskHeight, rasterBuffers.count == rasterBufferCount {
      return true
    }
    maskWidth = width
    maskHeight = height
    smoothed = [Float](repeating: 0, count: width * height)
    rasterBuffers = (0..<rasterBufferCount).compactMap { _ in
      MaskRasterBuffer(width: width, height: height, colorSpace: colorSpace)
    }
    nextRasterBufferIndex = 0
    return rasterBuffers.count == rasterBufferCount
  }

  private func recordExtractionFailure(
    _ message: String,
    diagnostics: SegmentationMaskFrameDiagnostics
  ) -> SegmentationMaskRenderResult {
    extractionFailures += 1
    guard extractionFailures >= maxExtractionFailures, !unavailableReported else {
      return SegmentationMaskRenderResult(content: .hidden, diagnostics: diagnostics)
    }
    unavailableReported = true
    return SegmentationMaskRenderResult(
      content: .unavailable("segmentation-mask-extract-failed: \(message)"),
      diagnostics: diagnostics)
  }

  private func diagnostics(
    collect: Bool,
    startMs: Double,
    extractionEndMs: Double,
    rasterEndMs: Double,
    dataType: String,
    sourceWidth: Int,
    sourceHeight: Int,
    rasterWidth: Int,
    rasterHeight: Int
  ) -> SegmentationMaskFrameDiagnostics {
    SegmentationMaskFrameDiagnostics(
      extractionMs: collect ? max(0, extractionEndMs - startMs) : 0,
      rasterMs: collect ? max(0, rasterEndMs - extractionEndMs) : 0,
      postprocessMs: collect ? max(0, rasterEndMs - startMs) : 0,
      dataType: dataType,
      sourceWidth: sourceWidth,
      sourceHeight: sourceHeight,
      rasterWidth: rasterWidth,
      rasterHeight: rasterHeight)
  }

  private func nowMs() -> Double {
    CACurrentMediaTime() * 1000
  }
}

func segmentationMaskFigureAlphaFraction(_ confidence: Float) -> Float {
  let t = ((confidence - maskVisibleStart) / (maskVisibleFull - maskVisibleStart)).clamped(to: 0...1)
  return t * t * (3 - 2 * t)
}

private func premultiply(_ component: UInt8, alpha: UInt8) -> UInt8 {
  UInt8((Int(component) * Int(alpha) + 127) / 255)
}

private extension Comparable {
  func clamped(to limits: ClosedRange<Self>) -> Self {
    min(max(self, limits.lowerBound), limits.upperBound)
  }
}
