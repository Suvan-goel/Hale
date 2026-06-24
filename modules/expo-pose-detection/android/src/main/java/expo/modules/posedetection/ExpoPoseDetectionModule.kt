package expo.modules.posedetection

import android.Manifest
import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.provider.Settings
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
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

    AsyncFunction("getAndroidNavigationModeAsync") {
      getAndroidNavigationMode()
    }

    AsyncFunction("setAndroidNavigationBarVisibleAsync") { visible: Boolean ->
      setAndroidNavigationBarVisible(visible)
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

  private fun getAndroidNavigationMode(): String {
    val context = appContext.reactContext ?: return "unknown"
    val mode = try {
      Settings.Secure.getInt(context.contentResolver, "navigation_mode", -1)
    } catch (_: Throwable) {
      -1
    }
    return when (mode) {
      0, 1 -> "button"
      2 -> "gesture"
      else -> "unknown"
    }
  }

  private fun setAndroidNavigationBarVisible(visible: Boolean) {
    val activity = appContext.currentActivity ?: return
    activity.runOnUiThread {
      val window = activity.window ?: return@runOnUiThread
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        window.insetsController?.let { controller ->
          controller.systemBarsBehavior =
            WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
          if (visible) {
            controller.show(WindowInsets.Type.navigationBars())
          } else {
            controller.hide(WindowInsets.Type.navigationBars())
          }
        }
        return@runOnUiThread
      }

      @Suppress("DEPRECATION")
      val currentFlags = window.decorView.systemUiVisibility
      window.decorView.systemUiVisibility = if (visible) {
        currentFlags
          .and(View.SYSTEM_UI_FLAG_HIDE_NAVIGATION.inv())
          .and(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY.inv())
          .and(View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION.inv())
      } else {
        currentFlags
          .or(View.SYSTEM_UI_FLAG_HIDE_NAVIGATION)
          .or(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
          .or(View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)
          .or(View.SYSTEM_UI_FLAG_LAYOUT_STABLE)
      }
    }
  }
}
