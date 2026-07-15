package expo.modules.posedetection

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.os.SystemClock
import com.google.mediapipe.framework.image.ByteBufferExtractor
import com.google.mediapipe.framework.image.MPImage
import java.nio.ByteOrder

private const val MASK_DOWNSAMPLE_STRIDE = 2
private const val MASK_VISIBLE_START = 0.30f
private const val MASK_VISIBLE_FULL = 0.75f
private const val MASK_ATTACK_ALPHA = 0.5f
private const val MASK_RELEASE_ALPHA = 0.3f
// A translucent matte reads as a designed figure rather than a mirror. The
// person contour remains clear while skin, clothing, and room pixels never
// appear.
private const val MASK_MAX_ALPHA = 82
private const val MAX_EXTRACTION_FAILURES = 3

internal data class SegmentationMaskFrameDiagnostics(
  val extractionMs: Double = 0.0,
  val rasterMs: Double = 0.0,
  val postprocessMs: Double = 0.0,
  val publishMs: Double = 0.0,
  val dataType: String = "none",
  val sourceWidth: Int = 0,
  val sourceHeight: Int = 0,
  val rasterWidth: Int = 0,
  val rasterHeight: Int = 0,
) {
  companion object {
    val NOT_COLLECTED = SegmentationMaskFrameDiagnostics(dataType = "not-collected")
    val DISABLED = SegmentationMaskFrameDiagnostics(dataType = "disabled")
  }
}

/**
 * Renders the MediaPipe person segmentation mask as a matte tinted figure:
 * the user's true contour with zero photographic content (product law #1 —
 * this is not camera video; background pixels are never rendered).
 *
 * Confidence is temporally smoothed per pixel (asymmetric EMA, fast attack /
 * slow release) so mask-boundary flicker reads as a soft feathered edge
 * instead of shimmer. The mask never crosses the JS bridge: extraction runs
 * on the analysis thread, drawing on the UI thread, with a double-buffered
 * bitmap swapped under [lock].
 */
internal class SegmentationMaskFigureRenderer(
  private val requestDraw: () -> Unit,
) {
  /** Invoked once when extraction fails repeatedly and the figure disables itself. */
  var onExtractionUnavailable: ((String) -> Unit)? = null

  private val lock = Any()
  private var frontBitmap: Bitmap? = null
  private var backBitmap: Bitmap? = null
  private var pixels = IntArray(0)
  private var smoothed = FloatArray(0)
  private var maskWidth = 0
  private var maskHeight = 0
  private var uprightAspect = 3f / 4f
  private var visible = false
  private var extractionFailures = 0
  private var extractionUnavailableReported = false
  private var tintRgb = 0x8E3158
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
  private val dstRect = RectF()

  fun setColor(color: Int) {
    synchronized(lock) {
      tintRgb = color and 0x00FFFFFF
    }
  }

  /**
   * Extracts, smooths, and tints one mask frame. Called on the analysis (or
   * live-stream callback) thread; must finish before the caller releases the
   * result. The bitmap is stored upright so [draw] never needs rotation.
   */
  fun submitMask(
    mask: MPImage,
    rotationDegrees: Int,
    uprightWidth: Int,
    uprightHeight: Int,
    collectDiagnostics: Boolean,
  ): SegmentationMaskFrameDiagnostics {
    if (extractionFailures >= MAX_EXTRACTION_FAILURES) {
      return SegmentationMaskFrameDiagnostics.DISABLED
    }
    val srcWidth = mask.width
    val srcHeight = mask.height
    if (srcWidth <= 0 || srcHeight <= 0) return SegmentationMaskFrameDiagnostics()
    val rotation = normalizeRotationDegrees(rotationDegrees)
    val swapped = rotation == 90 || rotation == 270
    val uprightMaskWidth = if (swapped) srcHeight else srcWidth
    val uprightMaskHeight = if (swapped) srcWidth else srcHeight
    val downWidth = maxOf(1, uprightMaskWidth / MASK_DOWNSAMPLE_STRIDE)
    val downHeight = maxOf(1, uprightMaskHeight / MASK_DOWNSAMPLE_STRIDE)
    val postprocessStartMs = if (collectDiagnostics) nowMs() else 0.0
    var extractionEndMs = postprocessStartMs
    var extractionCompleted = false
    var dataType = "unknown"

    try {
      val byteBuffer = ByteBufferExtractor.extract(mask)
      byteBuffer.rewind()
      val pixelCount = srcWidth * srcHeight
      val isFloatMask = byteBuffer.capacity() >= pixelCount * 4
      val isByteMask = !isFloatMask && byteBuffer.capacity() >= pixelCount
      if (!isFloatMask && !isByteMask) {
        throw IllegalStateException(
          "unexpected mask buffer capacity ${byteBuffer.capacity()} for ${srcWidth}x$srcHeight"
        )
      }
      val floats = if (isFloatMask) {
        byteBuffer.order(ByteOrder.nativeOrder()).asFloatBuffer()
      } else {
        null
      }
      dataType = if (isFloatMask) "float32" else "uint8"
      extractionEndMs = if (collectDiagnostics) nowMs() else 0.0
      extractionCompleted = true

      synchronized(lock) {
        ensureBuffers(downWidth, downHeight)
        uprightAspect = if (uprightWidth > 0 && uprightHeight > 0) {
          uprightWidth.toFloat() / uprightHeight.toFloat()
        } else {
          uprightMaskWidth.toFloat() / uprightMaskHeight.toFloat()
        }
        val rgb = tintRgb
        var anyVisible = false
        var index = 0
        for (y in 0 until downHeight) {
          val uprightY = y * MASK_DOWNSAMPLE_STRIDE
          for (x in 0 until downWidth) {
            val uprightX = x * MASK_DOWNSAMPLE_STRIDE
            val sourceX = maskSourceXForUprightPixel(uprightX, uprightY, rotation, srcWidth, srcHeight)
            val sourceY = maskSourceYForUprightPixel(uprightX, uprightY, rotation, srcWidth, srcHeight)
            val sourceIndex = sourceY * srcWidth + sourceX
            val raw = if (floats != null) {
              floats.get(sourceIndex)
            } else {
              (byteBuffer.get(sourceIndex).toInt() and 0xFF) / 255f
            }
            val target = raw.coerceIn(0f, 1f)
            val current = smoothed[index]
            val alpha = if (target > current) MASK_ATTACK_ALPHA else MASK_RELEASE_ALPHA
            val next = current + (target - current) * alpha
            smoothed[index] = next
            val fraction = maskFigureAlphaFraction(next)
            if (fraction > 0f) {
              anyVisible = true
              pixels[index] = ((fraction * MASK_MAX_ALPHA).toInt() shl 24) or rgb
            } else {
              pixels[index] = 0
            }
            index++
          }
        }
        val target = checkNotNull(backBitmap)
        target.setPixels(pixels, 0, downWidth, 0, 0, downWidth, downHeight)
        backBitmap = frontBitmap
        frontBitmap = target
        visible = anyVisible
      }
      extractionFailures = 0
      requestDraw()
      if (!collectDiagnostics) return SegmentationMaskFrameDiagnostics.NOT_COLLECTED
      val publishMs = if (collectDiagnostics) nowMs() else 0.0
      return SegmentationMaskFrameDiagnostics(
        extractionMs = if (collectDiagnostics) extractionEndMs - postprocessStartMs else 0.0,
        rasterMs = if (collectDiagnostics) publishMs - extractionEndMs else 0.0,
        postprocessMs = if (collectDiagnostics) publishMs - postprocessStartMs else 0.0,
        publishMs = publishMs,
        dataType = dataType,
        sourceWidth = srcWidth,
        sourceHeight = srcHeight,
        rasterWidth = downWidth,
        rasterHeight = downHeight,
      )
    } catch (t: Throwable) {
      extractionFailures += 1
      if (extractionFailures >= MAX_EXTRACTION_FAILURES && !extractionUnavailableReported) {
        extractionUnavailableReported = true
        synchronized(lock) { visible = false }
        requestDraw()
        onExtractionUnavailable?.invoke("segmentation-mask-extract-failed: ${t.message}")
      }
      if (!collectDiagnostics) return SegmentationMaskFrameDiagnostics.NOT_COLLECTED
      val failureEndMs = if (collectDiagnostics) nowMs() else 0.0
      return SegmentationMaskFrameDiagnostics(
        extractionMs = if (collectDiagnostics) {
          ((if (extractionCompleted) extractionEndMs else failureEndMs) - postprocessStartMs)
            .coerceAtLeast(0.0)
        } else {
          0.0
        },
        rasterMs = if (collectDiagnostics) {
          (if (extractionCompleted) failureEndMs - extractionEndMs else 0.0).coerceAtLeast(0.0)
        } else {
          0.0
        },
        postprocessMs = if (collectDiagnostics) {
          (failureEndMs - postprocessStartMs).coerceAtLeast(0.0)
        } else {
          0.0
        },
        publishMs = failureEndMs,
        dataType = "error:$dataType",
        sourceWidth = srcWidth,
        sourceHeight = srcHeight,
        rasterWidth = downWidth,
        rasterHeight = downHeight,
      )
    }
  }

  /** Subject gone: hide immediately so no ghost figure lingers (re-entry lesson). */
  fun submitNoSubject(collectDiagnostics: Boolean): SegmentationMaskFrameDiagnostics {
    var changed = false
    synchronized(lock) {
      if (visible) {
        visible = false
        changed = true
      }
      smoothed.fill(0f)
    }
    if (changed) requestDraw()
    if (!collectDiagnostics) return SegmentationMaskFrameDiagnostics.NOT_COLLECTED
    return SegmentationMaskFrameDiagnostics(
      publishMs = if (collectDiagnostics) nowMs() else 0.0,
      dataType = "no-subject",
    )
  }

  fun clear() {
    synchronized(lock) {
      visible = false
      smoothed.fill(0f)
    }
    requestDraw()
  }

  fun draw(canvas: Canvas, viewWidth: Int, viewHeight: Int, mirrored: Boolean) {
    if (viewWidth <= 0 || viewHeight <= 0) return
    synchronized(lock) {
      if (!visible) return
      val bitmap = frontBitmap ?: return
      // Contain-fit: identical math to the JS fit-frame / native skeleton so
      // the figure lands inside the same rect the JS overlay draws.
      val viewW = viewWidth.toFloat()
      val viewH = viewHeight.toFloat()
      val viewAspect = viewW / viewH
      val fittedWidth: Float
      val fittedHeight: Float
      if (viewAspect < uprightAspect) {
        fittedWidth = viewW
        fittedHeight = viewW / uprightAspect
      } else {
        fittedHeight = viewH
        fittedWidth = viewH * uprightAspect
      }
      val offsetX = (viewW - fittedWidth) / 2f
      val offsetY = (viewH - fittedHeight) / 2f
      dstRect.set(offsetX, offsetY, offsetX + fittedWidth, offsetY + fittedHeight)
      val save = canvas.save()
      if (mirrored) canvas.scale(-1f, 1f, viewW / 2f, 0f)
      canvas.drawBitmap(bitmap, null, dstRect, paint)
      canvas.restoreToCount(save)
    }
  }

  private fun ensureBuffers(downWidth: Int, downHeight: Int) {
    if (downWidth == maskWidth && downHeight == maskHeight && frontBitmap != null) return
    maskWidth = downWidth
    maskHeight = downHeight
    pixels = IntArray(downWidth * downHeight)
    smoothed = FloatArray(downWidth * downHeight)
    frontBitmap = Bitmap.createBitmap(downWidth, downHeight, Bitmap.Config.ARGB_8888)
    backBitmap = Bitmap.createBitmap(downWidth, downHeight, Bitmap.Config.ARGB_8888)
    visible = false
  }

  private fun nowMs(): Double = SystemClock.elapsedRealtimeNanos() / 1_000_000.0
}

/**
 * Soft edge ramp: confidence below [MASK_VISIBLE_START] is invisible, above
 * [MASK_VISIBLE_FULL] is full figure alpha, smoothstepped between so the
 * contour feathers instead of aliasing.
 */
internal fun maskFigureAlphaFraction(confidence: Float): Float {
  val t = ((confidence - MASK_VISIBLE_START) / (MASK_VISIBLE_FULL - MASK_VISIBLE_START))
    .coerceIn(0f, 1f)
  return t * t * (3f - 2f * t)
}

/**
 * Inverse of [uprightNormalizedX]/[uprightNormalizedY] in pixel space: maps an
 * upright-image pixel back to the mask's own (possibly rotated) pixel grid.
 */
internal fun maskSourceXForUprightPixel(
  uprightX: Int,
  uprightY: Int,
  rotationDegrees: Int,
  sourceWidth: Int,
  sourceHeight: Int,
): Int {
  val x = when (normalizeRotationDegrees(rotationDegrees)) {
    90 -> uprightY
    180 -> sourceWidth - 1 - uprightX
    270 -> sourceWidth - 1 - uprightY
    else -> uprightX
  }
  return x.coerceIn(0, sourceWidth - 1)
}

internal fun maskSourceYForUprightPixel(
  uprightX: Int,
  uprightY: Int,
  rotationDegrees: Int,
  sourceWidth: Int,
  sourceHeight: Int,
): Int {
  val y = when (normalizeRotationDegrees(rotationDegrees)) {
    90 -> sourceHeight - 1 - uprightX
    180 -> sourceHeight - 1 - uprightY
    270 -> uprightX
    else -> uprightY
  }
  return y.coerceIn(0, sourceHeight - 1)
}
