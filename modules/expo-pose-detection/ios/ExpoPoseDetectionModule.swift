import AVFoundation
import ExpoModulesCore

public class ExpoPoseDetectionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoPoseDetection")

    AsyncFunction("requestCameraPermissionsAsync") { (promise: Promise) in
      switch AVCaptureDevice.authorizationStatus(for: .video) {
      case .authorized:
        promise.resolve(["status": "granted", "granted": true, "canAskAgain": true])
      case .notDetermined:
        AVCaptureDevice.requestAccess(for: .video) { granted in
          promise.resolve([
            "status": granted ? "granted" : "denied",
            "granted": granted,
            "canAskAgain": granted,
          ])
        }
      default:
        promise.resolve(["status": "denied", "granted": false, "canAskAgain": false])
      }
    }

    AsyncFunction("getCameraPermissionsAsync") { (promise: Promise) in
      switch AVCaptureDevice.authorizationStatus(for: .video) {
      case .authorized:
        promise.resolve(["status": "granted", "granted": true, "canAskAgain": true])
      case .notDetermined:
        promise.resolve(["status": "undetermined", "granted": false, "canAskAgain": true])
      default:
        promise.resolve(["status": "denied", "granted": false, "canAskAgain": false])
      }
    }

    AsyncFunction("isCameraAvailableAsync") { (cameraFacing: String) -> Bool in
      let position: AVCaptureDevice.Position = cameraFacing == "back" ? .back : .front
      let discovery = AVCaptureDevice.DiscoverySession(
        deviceTypes: [.builtInWideAngleCamera],
        mediaType: .video,
        position: position
      )
      return !discovery.devices.isEmpty
    }

    View(PoseDetectionView.self) {
      Events("onLandmarks", "onCameraReady", "onPoseError")

      Prop("active") { (view: PoseDetectionView, value: Bool) in
        view.setActiveProp(value)
      }
      Prop("cameraFacing") { (view: PoseDetectionView, value: String) in
        view.setCameraFacingProp(value)
      }
      Prop("modelVariant") { (view: PoseDetectionView, value: String) in
        view.setModelVariantProp(value)
      }
      Prop("minDetectionConfidence") { (view: PoseDetectionView, value: Double) in
        view.setMinDetectionConfidenceProp(Float(value))
      }
      Prop("minTrackingConfidence") { (view: PoseDetectionView, value: Double) in
        view.setMinTrackingConfidenceProp(Float(value))
      }
      Prop("minPresenceConfidence") { (view: PoseDetectionView, value: Double) in
        view.setMinPresenceConfidenceProp(Float(value))
      }
      Prop("latencyDiagnosticsEnabled") { (view: PoseDetectionView, value: Bool) in
        view.setLatencyDiagnosticsEnabledProp(value)
      }
    }
  }
}
