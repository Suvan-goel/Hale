import AVFoundation
import ExpoModulesCore
import MediaPipeTasksVision
import QuartzCore

private let landmarkCount = 33
private let landmarkStride = 5
private let defaultSkeletonConfidence = 0.35

private let mediaPipePoseConnections: [(Int, Int)] = [
  (0, 1),
  (1, 2),
  (2, 3),
  (3, 7),
  (0, 4),
  (4, 5),
  (5, 6),
  (6, 8),
  (9, 10),
  (11, 12),
  (11, 13),
  (13, 15),
  (15, 17),
  (15, 19),
  (15, 21),
  (17, 19),
  (12, 14),
  (14, 16),
  (16, 18),
  (16, 20),
  (16, 22),
  (18, 20),
  (11, 23),
  (12, 24),
  (23, 24),
  (23, 25),
  (25, 27),
  (27, 29),
  (29, 31),
  (27, 31),
  (24, 26),
  (26, 28),
  (28, 30),
  (30, 32),
  (28, 32),
]

private struct PoseLatencyDiagnostics {
  let frameId: Int
  let sourceTimestampMs: Double
  let preprocessingStartMs: Double
  let preprocessingEndMs: Double
  let mediapipeSubmitMs: Double
  let mediapipeCallbackMs: Double
}

private struct NativePoseEvent {
  let generation: Int
  let frameId: Int
  let timestampMs: Int
  let inferenceMs: Double
  let width: Int
  let height: Int
  let flat: [Double]
  let maskRenderResult: SegmentationMaskRenderResult
  let segmentationMaskEnabled: Bool
  let nativePostprocessEndMs: Double
  let resultFlattenMs: Double
  let diagnostics: PoseLatencyDiagnostics?
}

/**
 * Owns AVCaptureSession + MediaPipe PoseLandmarker. No preview layer is ever
 * attached — the view renders a solid warm-stone canvas (the app's bg-base) and
 * emits one landmark event per frame; the JS skeleton is drawn on top. Inference
 * runs synchronously in VIDEO mode on the capture queue with monotonic timestamps.
 */
class PoseDetectionView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate {
  let onLandmarks = EventDispatcher()
  let onCameraReady = EventDispatcher()
  let onPoseError = EventDispatcher()

  private let session = AVCaptureSession()
  private let sessionQueue = DispatchQueue(label: "expo.posedetection.session")
  private let videoQueue = DispatchQueue(label: "expo.posedetection.video")
  private var landmarker: PoseLandmarker?
  private var sessionConfigured = false
  private var running = false
  private var lastTimestampMs = -1
  private var frameId = 0
  private var sessionGeneration = 0
  private let segmentationMaskLayer = CALayer()
  private let segmentationMaskFigureRenderer = SegmentationMaskFigureRenderer()
  private let skeletonLayer = CAShapeLayer()
  private lazy var nativeEventScheduler = LatestNativeEventScheduler<NativePoseEvent>(
    getOrder: { $0.frameId },
    schedule: { block in DispatchQueue.main.async(execute: block) },
    emit: { [weak self] event in self?.emitNativePoseEvent(event) })

  // Props (defaults mirror the JS-side defaults).
  private var active = false
  private var cameraFacing = "front"
  private var modelVariant = "full"
  private var minDetectionConfidence: Float = 0.35
  private var minTrackingConfidence: Float = 0.35
  private var minPresenceConfidence: Float = 0.35
  private var latencyDiagnosticsEnabled = false
  private var segmentationMaskFigureEnabled = false
  private var nativeSkeletonOverlayEnabled = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    // focus-canvas (#FAF8F7) - keep in sync with the JS theme token (src/theme).
    backgroundColor = UIColor(red: 0xFA / 255.0, green: 0xF8 / 255.0, blue: 0xF7 / 255.0, alpha: 1.0)
    segmentationMaskLayer.contentsGravity = .resizeAspect
    segmentationMaskLayer.minificationFilter = .linear
    segmentationMaskLayer.magnificationFilter = .linear
    segmentationMaskLayer.isHidden = true
    skeletonLayer.fillColor = nil
    skeletonLayer.strokeColor = UIColor(red: 0xEE / 255.0, green: 0xE2 / 255.0, blue: 0xDC / 255.0, alpha: 1.0).cgColor
    skeletonLayer.lineCap = .round
    skeletonLayer.lineJoin = .round
    skeletonLayer.contentsScale = UIScreen.main.scale
    layer.addSublayer(segmentationMaskLayer)
    layer.addSublayer(skeletonLayer)
  }

  func setActiveProp(_ value: Bool) {
    guard active != value else { return }
    active = value
    syncState()
  }

  func setCameraFacingProp(_ value: String) {
    guard cameraFacing != value else { return }
    cameraFacing = value
    updateSegmentationMaskLayerGeometry()
    restartIfRunning()
  }

  func setModelVariantProp(_ value: String) {
    guard modelVariant != value else { return }
    modelVariant = value
    restartIfRunning()
  }

  func setMinDetectionConfidenceProp(_ value: Float) {
    guard minDetectionConfidence != value else { return }
    minDetectionConfidence = value
    restartIfRunning()
  }

  func setMinTrackingConfidenceProp(_ value: Float) {
    guard minTrackingConfidence != value else { return }
    minTrackingConfidence = value
    restartIfRunning()
  }

  func setMinPresenceConfidenceProp(_ value: Float) {
    guard minPresenceConfidence != value else { return }
    minPresenceConfidence = value
    restartIfRunning()
  }

  func setLatencyDiagnosticsEnabledProp(_ value: Bool) {
    latencyDiagnosticsEnabled = value
  }

  func setSegmentationMaskFigureEnabledProp(_ value: Bool) {
    guard segmentationMaskFigureEnabled != value else { return }
    segmentationMaskFigureEnabled = value
    segmentationMaskFigureRenderer.clearSubject()
    setSegmentationMaskVisible(false)
    // The landmarker only produces masks when requested at construction.
    restartIfRunning()
  }

  func setSegmentationMaskFigureColorProp(_ value: String) {
    segmentationMaskFigureRenderer.setColor(
      UIColor(hexString: value)
        ?? UIColor(red: 0x8E / 255.0, green: 0x31 / 255.0, blue: 0x58 / 255.0, alpha: 1.0)
    )
  }

  func setAndroidPipelineModeProp(_ value: String) {}

  func setAndroidRotationModeProp(_ value: String) {}

  func setAndroidAnalysisResolutionProp(_ value: String) {}

  func setNativeSkeletonOverlayEnabledProp(_ value: Bool) {
    guard nativeSkeletonOverlayEnabled != value else { return }
    nativeSkeletonOverlayEnabled = value
    if !value { skeletonLayer.path = nil }
  }

  func setNativeSkeletonColorProp(_ value: String) {
    skeletonLayer.strokeColor = UIColor(hexString: value)?.cgColor ?? UIColor(red: 0xEE / 255.0, green: 0xE2 / 255.0, blue: 0xDC / 255.0, alpha: 1.0).cgColor
  }

  func setNativeBenchmarkOverlayModeProp(_ value: String) {}

  func setNativeBenchmarkOverlayResetKeyProp(_ value: Int) {}

  func setCanvasColorProp(_ value: String) {
    backgroundColor = UIColor(hexString: value)
      ?? UIColor(red: 0xF9 / 255.0, green: 0xF5 / 255.0, blue: 0xEF / 255.0, alpha: 1.0)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    updateSegmentationMaskLayerGeometry()
    skeletonLayer.frame = bounds
  }

  override func willMove(toWindow newWindow: UIWindow?) {
    super.willMove(toWindow: newWindow)
    if newWindow == nil {
      stop()
    } else {
      syncState()
    }
  }

  private func syncState() {
    if active && window != nil && !running {
      start()
    } else if (!active || window == nil) && running {
      stop()
    }
  }

  private func restartIfRunning() {
    if running {
      stop()
      start()
    }
  }

  private func start() {
    guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else {
      onPoseError(["message": "camera-permission-not-granted"])
      return
    }
    running = true
    // Hands-free sessions run for minutes with no touches; hold the screen on
    // while the camera is live so the device never dims or locks mid-recording.
    UIApplication.shared.isIdleTimerDisabled = true
    lastTimestampMs = -1
    frameId = 0
    sessionGeneration += 1
    nativeEventScheduler.reset()
    sessionQueue.async { [weak self] in
      guard let self, self.running else { return }
      do {
        self.landmarker = try self.createLandmarker()
      } catch {
        DispatchQueue.main.async {
          self.onPoseError(["message": "landmarker-init-failed: \(error.localizedDescription)"])
        }
        return
      }
      do {
        try self.configureSessionIfNeeded()
      } catch {
        DispatchQueue.main.async {
          self.onPoseError(["message": "camera-setup-failed: \(error.localizedDescription)"])
        }
        return
      }
      self.session.startRunning()
      DispatchQueue.main.async { self.onCameraReady([:]) }
    }
  }

  private func stop() {
    running = false
    sessionGeneration += 1
    nativeEventScheduler.cancel()
    UIApplication.shared.isIdleTimerDisabled = false
    segmentationMaskFigureRenderer.clearSubject()
    setSegmentationMaskVisible(false)
    sessionQueue.async { [weak self] in
      guard let self else { return }
      if self.session.isRunning {
        self.session.stopRunning()
      }
      self.landmarker = nil
    }
  }

  private func configureSessionIfNeeded() throws {
    // Re-configure when the camera facing changed since last setup.
    if sessionConfigured {
      session.beginConfiguration()
      for input in session.inputs { session.removeInput(input) }
      for output in session.outputs { session.removeOutput(output) }
      session.commitConfiguration()
      sessionConfigured = false
    }

    session.beginConfiguration()
    // Keep the locked 640x480 capture input; MediaPipe performs its own model
    // input resize. Mask presentation must not change measurement resolution.
    session.sessionPreset = .vga640x480

    let position: AVCaptureDevice.Position = cameraFacing == "back" ? .back : .front
    guard
      let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position),
      let input = try? AVCaptureDeviceInput(device: device),
      session.canAddInput(input)
    else {
      session.commitConfiguration()
      throw NSError(
        domain: "ExpoPoseDetection", code: 1,
        userInfo: [NSLocalizedDescriptionKey: "camera input unavailable"])
    }
    session.addInput(input)

    let output = AVCaptureVideoDataOutput()
    output.videoSettings = [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
    ]
    output.alwaysDiscardsLateVideoFrames = true
    output.setSampleBufferDelegate(self, queue: videoQueue)
    guard session.canAddOutput(output) else {
      session.commitConfiguration()
      throw NSError(
        domain: "ExpoPoseDetection", code: 2,
        userInfo: [NSLocalizedDescriptionKey: "video output unavailable"])
    }
    session.addOutput(output)

    if let connection = output.connection(with: .video) {
      // Deliver upright portrait buffers; landmarks arrive in upright space.
      if #available(iOS 17.0, *) {
        if connection.isVideoRotationAngleSupported(90) {
          connection.videoRotationAngle = 90
        }
      } else if connection.isVideoOrientationSupported {
        connection.videoOrientation = .portrait
      }
      // Mirroring for the front camera is handled in JS rendering, not here —
      // landmark coordinates stay in unmirrored image space on both platforms.
      connection.automaticallyAdjustsVideoMirroring = false
      if connection.isVideoMirroringSupported {
        connection.isVideoMirrored = false
      }
    }

    session.commitConfiguration()
    sessionConfigured = true
  }

  private func createLandmarker() throws -> PoseLandmarker {
    let modelName = modelVariant == "full" ? "pose_landmarker_full" : "pose_landmarker_lite"
    guard let modelPath = PoseDetectionView.findModelPath(named: modelName) else {
      throw NSError(
        domain: "ExpoPoseDetection", code: 3,
        userInfo: [
          NSLocalizedDescriptionKey:
            "model \(modelName).task not bundled — run scripts/download-models.sh and rebuild"
        ])
    }
    do {
      return try PoseDetectionView.buildLandmarker(
        modelPath: modelPath, delegate: .GPU,
        detection: minDetectionConfidence, tracking: minTrackingConfidence,
        presence: minPresenceConfidence,
        outputSegmentationMasks: segmentationMaskFigureEnabled)
    } catch {
      // GPU delegate can fail (simulator, older devices); CPU still hits
      // ~30fps with the lite model on modern iPhones.
      DispatchQueue.main.async {
        self.onPoseError(["message": "gpu-delegate-failed-falling-back-to-cpu"])
      }
      return try PoseDetectionView.buildLandmarker(
        modelPath: modelPath, delegate: .CPU,
        detection: minDetectionConfidence, tracking: minTrackingConfidence,
        presence: minPresenceConfidence,
        outputSegmentationMasks: segmentationMaskFigureEnabled)
    }
  }

  private static func buildLandmarker(
    modelPath: String, delegate: Delegate,
    detection: Float, tracking: Float, presence: Float,
    outputSegmentationMasks: Bool
  ) throws -> PoseLandmarker {
    let options = PoseLandmarkerOptions()
    options.baseOptions.modelAssetPath = modelPath
    options.baseOptions.delegate = delegate
    options.runningMode = .video
    options.numPoses = 1
    options.minPoseDetectionConfidence = detection
    options.minTrackingConfidence = tracking
    options.minPosePresenceConfidence = presence
    options.shouldOutputSegmentationMasks = outputSegmentationMasks
    return try PoseLandmarker(options: options)
  }

  private static func findModelPath(named name: String) -> String? {
    if let path = Bundle.main.path(forResource: name, ofType: "task") {
      return path
    }
    return Bundle(for: PoseDetectionView.self).path(forResource: name, ofType: "task")
  }

  // MARK: AVCaptureVideoDataOutputSampleBufferDelegate

  func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    guard running, let landmarker else { return }
    let diagnosticsEnabled = latencyDiagnosticsEnabled
    frameId += 1
    let diagnosticFrameId = frameId
    let generation = sessionGeneration
    let preprocessingStartMs = diagnosticsEnabled ? PoseDetectionView.nativeNowMs() : 0

    // Presentation timestamps are monotonic within a capture session; VIDEO
    // mode requires strictly increasing values.
    let pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
    var timestampMs = Int(CMTimeGetSeconds(pts) * 1000.0)
    if timestampMs <= lastTimestampMs { timestampMs = lastTimestampMs + 1 }
    lastTimestampMs = timestampMs

    guard let image = try? MPImage(sampleBuffer: sampleBuffer) else { return }
    let preprocessingEndMs = diagnosticsEnabled ? PoseDetectionView.nativeNowMs() : 0

    do {
      let mediapipeSubmitMs = diagnosticsEnabled ? PoseDetectionView.nativeNowMs() : 0
      let start = CACurrentMediaTime()
      let result = try landmarker.detect(videoFrame: image, timestampInMilliseconds: timestampMs)
      let inferenceMs = (CACurrentMediaTime() - start) * 1000.0
      let mediapipeCallbackMs = diagnosticsEnabled ? PoseDetectionView.nativeNowMs() : 0
      let diagnostics = diagnosticsEnabled
        ? PoseLatencyDiagnostics(
          frameId: diagnosticFrameId,
          sourceTimestampMs: Double(timestampMs),
          preprocessingStartMs: preprocessingStartMs,
          preprocessingEndMs: preprocessingEndMs,
          mediapipeSubmitMs: mediapipeSubmitMs,
          mediapipeCallbackMs: mediapipeCallbackMs)
        : nil
      dispatch(
        generation: generation, frameId: diagnosticFrameId,
        result: result, timestampMs: timestampMs, inferenceMs: inferenceMs,
        width: Int(image.width), height: Int(image.height), diagnostics: diagnostics)
    } catch {
      DispatchQueue.main.async {
        self.onPoseError(["message": "inference-failed: \(error.localizedDescription)"])
      }
    }
  }

  private func dispatch(
    generation: Int, frameId: Int,
    result: PoseLandmarkerResult, timestampMs: Int, inferenceMs: Double,
    width: Int, height: Int, diagnostics: PoseLatencyDiagnostics?
  ) {
    // A restart can finish while an older synchronous VIDEO inference is still
    // returning. Never let that stale frame poison the new session's ordering.
    guard running, generation == sessionGeneration else { return }
    let flattenStartMs = diagnostics != nil ? PoseDetectionView.nativeNowMs() : 0
    var flat: [Double]
    if let pose = result.landmarks.first {
      flat = [Double](repeating: 0, count: landmarkCount * landmarkStride)
      let count = min(pose.count, landmarkCount)
      for i in 0..<count {
        let lm = pose[i]
        let base = i * landmarkStride
        flat[base] = Double(lm.x)
        flat[base + 1] = Double(lm.y)
        flat[base + 2] = Double(lm.z)
        flat[base + 3] = Double(truncating: lm.visibility ?? 0)
        flat[base + 4] = Double(truncating: lm.presence ?? 0)
      }
    } else {
      // Empty landmarks still get an event: the JS pipeline needs frame
      // continuity to drive subject-gone detection.
      flat = []
    }
    let flattenEndMs = diagnostics != nil ? PoseDetectionView.nativeNowMs() : 0
    let maskRenderResult: SegmentationMaskRenderResult
    if segmentationMaskFigureEnabled {
      if flat.isEmpty {
        segmentationMaskFigureRenderer.clearSubject()
        maskRenderResult = .hidden(dataType: "no-subject")
      } else {
        maskRenderResult = segmentationMaskFigureRenderer.render(
          mask: result.segmentationMasks.first,
          collectDiagnostics: diagnostics != nil)
      }
    } else {
      maskRenderResult = .hidden(dataType: "disabled")
    }
    let nativePostprocessEndMs = diagnostics != nil ? PoseDetectionView.nativeNowMs() : 0
    nativeEventScheduler.submit(
      NativePoseEvent(
        generation: generation,
        frameId: frameId,
        timestampMs: timestampMs,
        inferenceMs: inferenceMs,
        width: width,
        height: height,
        flat: flat,
        maskRenderResult: maskRenderResult,
        segmentationMaskEnabled: segmentationMaskFigureEnabled,
        nativePostprocessEndMs: nativePostprocessEndMs,
        resultFlattenMs: diagnostics != nil ? flattenEndMs - flattenStartMs : 0,
        diagnostics: diagnostics))
  }

  /** Publishes one matched mask + landmark pair on the main thread. */
  private func emitNativePoseEvent(_ event: NativePoseEvent) {
    guard running, event.generation == sessionGeneration else { return }
    let payloadStartMs = event.diagnostics != nil ? PoseDetectionView.nativeNowMs() : 0
    applySegmentationMaskRenderResult(event.maskRenderResult)
    let maskPublishMs = event.diagnostics != nil && event.segmentationMaskEnabled
      ? PoseDetectionView.nativeNowMs()
      : 0
    updateNativeSkeleton(flat: event.flat, sourceWidth: event.width, sourceHeight: event.height)
    var payload: [String: Any] = [
      "timestampMs": Double(event.timestampMs),
      "landmarks": event.flat,
      "inferenceMs": event.inferenceMs,
      "sourceWidth": event.width,
      "sourceHeight": event.height,
    ]
    if let diagnostics = event.diagnostics {
      let nativeEventEmitMs = PoseDetectionView.nativeNowMs()
      let schedulerStats = nativeEventScheduler.stats()
      var latency: [String: Any] = [
        "frameId": Double(diagnostics.frameId),
        "nativeClock": "ios.CACurrentMediaTime",
        "sourceTimestampMs": diagnostics.sourceTimestampMs,
        "preprocessingStartMs": diagnostics.preprocessingStartMs,
        "preprocessingEndMs": diagnostics.preprocessingEndMs,
        "mediapipeSubmitMs": diagnostics.mediapipeSubmitMs,
        "mediapipeCallbackMs": diagnostics.mediapipeCallbackMs,
        "nativePostprocessEndMs": event.nativePostprocessEndMs,
        "nativeEventEmitMs": nativeEventEmitMs,
        "sourceAgeAtMediapipeSubmitMs": diagnostics.mediapipeSubmitMs - diagnostics.sourceTimestampMs,
        "sourceAgeAtMediapipeCallbackMs": diagnostics.mediapipeCallbackMs - diagnostics.sourceTimestampMs,
        "sourceAgeAtNativeEventEmitMs": nativeEventEmitMs - diagnostics.sourceTimestampMs,
        "resultFlattenMs": event.resultFlattenMs,
        "eventPayloadBuildMs": nativeEventEmitMs - payloadStartMs,
        "outputSegmentationMasks": event.segmentationMaskEnabled,
        "maskFrameId": Double(event.frameId),
        "maskExtractionMs": event.maskRenderResult.diagnostics.extractionMs,
        "maskRasterMs": event.maskRenderResult.diagnostics.rasterMs,
        "maskPostprocessMs": event.maskRenderResult.diagnostics.postprocessMs,
        "maskDataType": event.maskRenderResult.diagnostics.dataType,
        "maskSourceWidth": event.maskRenderResult.diagnostics.sourceWidth,
        "maskSourceHeight": event.maskRenderResult.diagnostics.sourceHeight,
        "maskRasterWidth": event.maskRenderResult.diagnostics.rasterWidth,
        "maskRasterHeight": event.maskRenderResult.diagnostics.rasterHeight,
        "nativeEventScheduledCount": Double(schedulerStats.scheduled),
        "nativeEventCoalescedCount": Double(schedulerStats.coalesced),
        "nativeEventRejectedCount": Double(schedulerStats.rejected),
        "nativeEventEmittedCount": Double(schedulerStats.emitted),
      ]
      if event.segmentationMaskEnabled {
        latency["maskPublishMs"] = maskPublishMs
        latency["sourceAgeAtMaskPublishMs"] = maskPublishMs - diagnostics.sourceTimestampMs
      }
      payload["latency"] = latency
    }
    onLandmarks(payload)
  }

  private func applySegmentationMaskRenderResult(_ result: SegmentationMaskRenderResult) {
    guard running, segmentationMaskFigureEnabled else {
      setSegmentationMaskVisible(false)
      return
    }
    switch result.content {
    case .image(let image):
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      segmentationMaskLayer.contents = image
      segmentationMaskLayer.isHidden = false
      CATransaction.commit()
    case .hidden:
      setSegmentationMaskVisible(false)
    case .unavailable(let message):
      setSegmentationMaskVisible(false)
      onPoseError(["message": message])
    }
  }

  private func setSegmentationMaskVisible(_ visible: Bool) {
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    segmentationMaskLayer.isHidden = !visible
    if !visible { segmentationMaskLayer.contents = nil }
    CATransaction.commit()
  }

  private func updateSegmentationMaskLayerGeometry() {
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    segmentationMaskLayer.bounds = bounds
    segmentationMaskLayer.position = CGPoint(x: bounds.midX, y: bounds.midY)
    segmentationMaskLayer.setAffineTransform(
      CGAffineTransform(scaleX: cameraFacing == "back" ? 1 : -1, y: 1)
    )
    CATransaction.commit()
  }

  private func updateNativeSkeleton(flat: [Double], sourceWidth: Int, sourceHeight: Int) {
    guard nativeSkeletonOverlayEnabled else { return }
    skeletonLayer.frame = bounds
    guard flat.count >= landmarkCount * landmarkStride, bounds.width > 0, bounds.height > 0 else {
      skeletonLayer.path = nil
      return
    }

    let viewWidth = bounds.width
    let viewHeight = bounds.height
    let sourceAspect = CGFloat(max(sourceWidth, 1)) / CGFloat(max(sourceHeight, 1))
    let viewAspect = viewWidth / viewHeight
    let useWidth = viewAspect < sourceAspect
    let sx: CGFloat
    let sy: CGFloat
    let ox: CGFloat
    let oy: CGFloat
    if useWidth {
      sx = viewWidth
      sy = viewWidth / sourceAspect
      ox = 0
      oy = (viewHeight - sy) / 2
    } else {
      sy = viewHeight
      sx = viewHeight * sourceAspect
      ox = (viewWidth - sx) / 2
      oy = 0
    }

    let mirrored = cameraFacing != "back"
    let path = CGMutablePath()
    for (a, b) in mediaPipePoseConnections {
      guard landmarkRenderable(flat, a), landmarkRenderable(flat, b) else { continue }
      path.move(to: CGPoint(x: mapLandmarkX(flat, a, mirrored, sx, ox), y: mapLandmarkY(flat, a, sy, oy)))
      path.addLine(to: CGPoint(x: mapLandmarkX(flat, b, mirrored, sx, ox), y: mapLandmarkY(flat, b, sy, oy)))
    }
    skeletonLayer.lineWidth = max(2.4, min(5.2, min(viewWidth, viewHeight) * 0.008))
    skeletonLayer.path = path
  }

  private func landmarkRenderable(_ landmarks: [Double], _ landmark: Int) -> Bool {
    let base = landmark * landmarkStride
    let x = landmarks[base]
    let y = landmarks[base + 1]
    guard x.isFinite, y.isFinite else { return false }
    let visibility = min(max(landmarks[base + 3], 0), 1)
    let presence = min(max(landmarks[base + 4], 0), 1)
    return min(visibility, presence) >= defaultSkeletonConfidence
  }

  private func mapLandmarkX(
    _ landmarks: [Double],
    _ landmark: Int,
    _ mirrored: Bool,
    _ sx: CGFloat,
    _ ox: CGFloat
  ) -> CGFloat {
    let normalized = landmarks[landmark * landmarkStride]
    let x = mirrored ? 1 - normalized : normalized
    return CGFloat(x) * sx + ox
  }

  private func mapLandmarkY(_ landmarks: [Double], _ landmark: Int, _ sy: CGFloat, _ oy: CGFloat) -> CGFloat {
    CGFloat(landmarks[landmark * landmarkStride + 1]) * sy + oy
  }

  private static func nativeNowMs() -> Double {
    CACurrentMediaTime() * 1000.0
  }
}

private extension UIColor {
  convenience init?(hexString: String) {
    let trimmed = hexString.trimmingCharacters(in: .whitespacesAndNewlines)
    let raw = trimmed.hasPrefix("#") ? String(trimmed.dropFirst()) : trimmed
    guard raw.count == 6, let value = Int(raw, radix: 16) else { return nil }
    self.init(
      red: CGFloat((value >> 16) & 0xFF) / 255.0,
      green: CGFloat((value >> 8) & 0xFF) / 255.0,
      blue: CGFloat(value & 0xFF) / 255.0,
      alpha: 1.0
    )
  }
}
