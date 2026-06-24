package expo.modules.posedetection

import android.Manifest
import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
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

    AsyncFunction("isCameraAvailableAsync") { cameraFacing: String ->
      hasCamera(cameraFacing)
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
      Prop("latencyDiagnosticsEnabled") { view: PoseDetectionView, value: Boolean ->
        view.setLatencyDiagnosticsEnabledProp(value)
      }
      Prop("androidPipelineMode") { view: PoseDetectionView, value: String ->
        view.setAndroidPipelineModeProp(value)
      }
      Prop("androidRotationMode") { view: PoseDetectionView, value: String ->
        view.setAndroidRotationModeProp(value)
      }
      Prop("androidAnalysisResolution") { view: PoseDetectionView, value: String ->
        view.setAndroidAnalysisResolutionProp(value)
      }
      Prop("nativeSkeletonOverlayEnabled") { view: PoseDetectionView, value: Boolean ->
        view.setNativeSkeletonOverlayEnabledProp(value)
      }
      Prop("nativeSkeletonColor") { view: PoseDetectionView, value: String ->
        view.setNativeSkeletonColorProp(value)
      }
      Prop("canvasColor") { view: PoseDetectionView, value: String ->
        view.setCanvasColorProp(value)
      }
    }
  }

  private fun hasCamera(cameraFacing: String): Boolean {
    val context = appContext.reactContext ?: return false
    val manager = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager ?: return false
    val targetLensFacing = if (cameraFacing == "back") {
      CameraCharacteristics.LENS_FACING_BACK
    } else {
      CameraCharacteristics.LENS_FACING_FRONT
    }
    return try {
      manager.cameraIdList.any { cameraId ->
        manager.getCameraCharacteristics(cameraId)
          .get(CameraCharacteristics.LENS_FACING) == targetLensFacing
      }
    } catch (_: Throwable) {
      false
    }
  }
}
