package expo.modules.posedetection

import android.Manifest
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoPoseDetectionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoPoseDetection")

    AsyncFunction("requestCameraPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(
        appContext.permissions,
        promise,
        Manifest.permission.CAMERA
      )
    }

    AsyncFunction("getCameraPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(
        appContext.permissions,
        promise,
        Manifest.permission.CAMERA
      )
    }

    View(PoseDetectionView::class) {
      Events("onLandmarks", "onCameraReady", "onPoseError")

      Prop("active") { view: PoseDetectionView, value: Boolean ->
        view.setActiveProp(value)
      }
      Prop("cameraFacing") { view: PoseDetectionView, value: String ->
        view.setCameraFacingProp(value)
      }
      Prop("modelVariant") { view: PoseDetectionView, value: String ->
        view.setModelVariantProp(value)
      }
      Prop("minDetectionConfidence") { view: PoseDetectionView, value: Double ->
        view.setMinDetectionConfidenceProp(value.toFloat())
      }
      Prop("minTrackingConfidence") { view: PoseDetectionView, value: Double ->
        view.setMinTrackingConfidenceProp(value.toFloat())
      }
      Prop("minPresenceConfidence") { view: PoseDetectionView, value: Double ->
        view.setMinPresenceConfidenceProp(value.toFloat())
      }
    }
  }
}
