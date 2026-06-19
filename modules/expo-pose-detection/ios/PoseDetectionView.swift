import AVFoundation
import ExpoModulesCore
import MediaPipeTasksVision

private let landmarkCount = 33
private let landmarkStride = 5

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

  // Props (defaults mirror the JS-side defaults).
  private var active = false
  private var cameraFacing = "front"
  private var modelVariant = "lite"
  private var minDetectionConfidence: Float = 0.35
  private var minTrackingConfidence: Float = 0.35
  private var minPresenceConfidence: Float = 0.35

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    // bg-base (#F7F5EF) - keep in sync with the JS theme token (src/theme).
    backgroundColor = UIColor(red: 0xF7 / 255.0, green: 0xF5 / 255.0, blue: 0xEF / 255.0, alpha: 1.0)
  }

  func setActiveProp(_ value: Bool) {
    guard active != value else { return }
    active = value
    syncState()
  }

  func setCameraFacingProp(_ value: String) {
    guard cameraFacing != value else { return }
    cameraFacing = value
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
    lastTimestampMs = -1
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
    // 640x480 is plenty: the lite model downscales to 256px internally.
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
        presence: minPresenceConfidence)
    } catch {
      // GPU delegate can fail (simulator, older devices); CPU still hits
      // ~30fps with the lite model on modern iPhones.
      DispatchQueue.main.async {
        self.onPoseError(["message": "gpu-delegate-failed-falling-back-to-cpu"])
      }
      return try PoseDetectionView.buildLandmarker(
        modelPath: modelPath, delegate: .CPU,
        detection: minDetectionConfidence, tracking: minTrackingConfidence,
        presence: minPresenceConfidence)
    }
  }

  private static func buildLandmarker(
    modelPath: String, delegate: Delegate,
    detection: Float, tracking: Float, presence: Float
  ) throws -> PoseLandmarker {
    let options = PoseLandmarkerOptions()
    options.baseOptions.modelAssetPath = modelPath
    options.baseOptions.delegate = delegate
    options.runningMode = .video
    options.numPoses = 1
    options.minPoseDetectionConfidence = detection
    options.minTrackingConfidence = tracking
    options.minPosePresenceConfidence = presence
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

    // Presentation timestamps are monotonic within a capture session; VIDEO
    // mode requires strictly increasing values.
    let pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
    var timestampMs = Int(CMTimeGetSeconds(pts) * 1000.0)
    if timestampMs <= lastTimestampMs { timestampMs = lastTimestampMs + 1 }
    lastTimestampMs = timestampMs

    guard let image = try? MPImage(sampleBuffer: sampleBuffer) else { return }

    do {
      let start = CACurrentMediaTime()
      let result = try landmarker.detect(videoFrame: image, timestampInMilliseconds: timestampMs)
      let inferenceMs = (CACurrentMediaTime() - start) * 1000.0
      dispatch(
        result: result, timestampMs: timestampMs, inferenceMs: inferenceMs,
        width: image.width, height: image.height)
    } catch {
      DispatchQueue.main.async {
        self.onPoseError(["message": "inference-failed: \(error.localizedDescription)"])
      }
    }
  }

  private func dispatch(
    result: PoseLandmarkerResult, timestampMs: Int, inferenceMs: Double,
    width: Int, height: Int
  ) {
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
    let payload: [String: Any] = [
      "timestampMs": Double(timestampMs),
      "landmarks": flat,
      "inferenceMs": inferenceMs,
      "sourceWidth": width,
      "sourceHeight": height,
    ]
    DispatchQueue.main.async { self.onLandmarks(payload) }
  }
}
