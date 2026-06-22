package expo.modules.posedetection

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Matrix
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.os.Trace
import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

private const val LANDMARK_COUNT = 33
private const val LANDMARK_STRIDE = 5

private data class PoseLatencyDiagnostics(
  val frameId: Long,
  val sourceTimestampMs: Double,
  val preprocessingStartMs: Double,
  val preprocessingEndMs: Double,
  val mediapipeSubmitMs: Double,
  val mediapipeCallbackMs: Double,
  val nativePostprocessEndMs: Double = 0.0,
  val nativeEventEmitMs: Double = 0.0,
)

/**
 * Owns CameraX + MediaPipe PoseLandmarker. No preview surface is ever
 * attached — the view renders a solid warm-stone canvas (the app's bg-base) and
 * emits one landmark event per analyzed frame; the JS skeleton is drawn on top.
 * Inference runs synchronously in VIDEO mode on a dedicated single-thread
 * executor with monotonic timestamps.
 */
class PoseDetectionView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext), LifecycleOwner {

  private val onLandmarks by EventDispatcher()
  private val onCameraReady by EventDispatcher()
  private val onPoseError by EventDispatcher()

  // The androidx.lifecycle in RN/Expo's dependency tree is the Java API:
  // override the method, drive state via handleLifecycleEvent (stable across
  // lifecycle versions, unlike the currentState setter).
  private val lifecycleRegistry = LifecycleRegistry(this)
  override fun getLifecycle(): Lifecycle = lifecycleRegistry

  private val mainHandler = Handler(Looper.getMainLooper())
  private var analysisExecutor: ExecutorService? = null
  private var cameraProvider: ProcessCameraProvider? = null
  private var poseLandmarker: PoseLandmarker? = null
  private var running = false
  private var attached = false
  private var lastTimestampMs = -1L
  private var frameId = 0L

  // Props (defaults mirror the JS-side defaults).
  private var active = false
  private var cameraFacing = "front"
  private var modelVariant = "lite"
  private var minDetectionConfidence = 0.35f
  private var minTrackingConfidence = 0.35f
  private var minPresenceConfidence = 0.35f
  private var latencyDiagnosticsEnabled = false

  init {
    // bg-base (#F9F5EF) - keep in sync with the JS theme token (src/theme).
    setBackgroundColor(Color.parseColor("#F9F5EF"))
    lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
  }

  fun setActiveProp(value: Boolean) {
    if (active == value) return
    active = value
    syncState()
  }

  fun setCameraFacingProp(value: String) {
    if (cameraFacing == value) return
    cameraFacing = value
    restartIfRunning()
  }

  fun setModelVariantProp(value: String) {
    if (modelVariant == value) return
    modelVariant = value
    restartIfRunning()
  }

  fun setMinDetectionConfidenceProp(value: Float) {
    if (minDetectionConfidence == value) return
    minDetectionConfidence = value
    restartIfRunning()
  }

  fun setMinTrackingConfidenceProp(value: Float) {
    if (minTrackingConfidence == value) return
    minTrackingConfidence = value
    restartIfRunning()
  }

  fun setMinPresenceConfidenceProp(value: Float) {
    if (minPresenceConfidence == value) return
    minPresenceConfidence = value
    restartIfRunning()
  }

  fun setLatencyDiagnosticsEnabledProp(value: Boolean) {
    latencyDiagnosticsEnabled = value
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    attached = true
    syncState()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    attached = false
    syncState()
  }

  private fun syncState() {
    val shouldRun = active && attached
    if (shouldRun && !running) start()
    if (!shouldRun && running) stop()
  }

  private fun restartIfRunning() {
    if (running) {
      stop()
      start()
    }
  }

  private fun start() {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
      != PackageManager.PERMISSION_GRANTED
    ) {
      onPoseError(mapOf("message" to "camera-permission-not-granted"))
      return
    }
    running = true
    lastTimestampMs = -1L
    frameId = 0L
    val executor = Executors.newSingleThreadExecutor()
    analysisExecutor = executor

    // Model load is slow (~100ms+); do it off the main thread, then bind the
    // camera on main. The analyzer skips frames until the landmarker exists.
    executor.execute {
      try {
        poseLandmarker = createLandmarker()
      } catch (e: Exception) {
        mainHandler.post {
          onPoseError(mapOf("message" to "landmarker-init-failed: ${e.message}"))
        }
        return@execute
      }
      mainHandler.post { if (running) bindCamera() }
    }
  }

  private fun bindCamera() {
    val providerFuture = ProcessCameraProvider.getInstance(context)
    providerFuture.addListener({
      if (!running) return@addListener
      try {
        val provider = providerFuture.get()
        cameraProvider = provider
        val selector = if (cameraFacing == "back") {
          CameraSelector.DEFAULT_BACK_CAMERA
        } else {
          CameraSelector.DEFAULT_FRONT_CAMERA
        }
        // 640x480 is plenty: the lite model downscales to 256px internally.
        val resolutionSelector = ResolutionSelector.Builder()
          .setResolutionStrategy(
            ResolutionStrategy(
              Size(640, 480),
              ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER
            )
          )
          .build()
        val analysis = ImageAnalysis.Builder()
          .setResolutionSelector(resolutionSelector)
          .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
          .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
          .build()
        analysisExecutor?.let { exec ->
          analysis.setAnalyzer(exec) { imageProxy -> processFrame(imageProxy) }
        }
        provider.unbindAll()
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_RESUME)
        provider.bindToLifecycle(this, selector, analysis)
        onCameraReady(emptyMap())
      } catch (e: Exception) {
        onPoseError(mapOf("message" to "camera-bind-failed: ${e.message}"))
      }
    }, ContextCompat.getMainExecutor(context))
  }

  private fun processFrame(imageProxy: ImageProxy) {
    val landmarker = poseLandmarker
    if (landmarker == null || !running) {
      imageProxy.close()
      return
    }
    try {
      val diagnosticsEnabled = latencyDiagnosticsEnabled
      val diagnosticFrameId = if (diagnosticsEnabled) ++frameId else 0L
      val preprocessingStartMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
      if (diagnosticsEnabled) Trace.beginSection("HalePose.preprocess")
      // Camera timestamps are boottime-monotonic; VIDEO mode requires
      // strictly increasing values.
      var timestampMs = imageProxy.imageInfo.timestamp / 1_000_000L
      if (timestampMs <= lastTimestampMs) timestampMs = lastTimestampMs + 1
      lastTimestampMs = timestampMs

      // Physically rotate the frame to upright BEFORE inference, rather than
      // relying on ImageProcessingOptions.setRotationDegrees — that proved
      // unreliable for BitmapImageBuilder inputs (landmarks came back in the
      // raw landscape sensor space, so a standing person rendered rotated 90°).
      // Rotating the pixels guarantees upright, unmirrored landmarks; the JS
      // renderer handles front-camera mirroring on display.
      val rotation = imageProxy.imageInfo.rotationDegrees
      val raw = imageProxy.toBitmap()
      imageProxy.close()
      val bitmap = if (rotation != 0) {
        val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
        Bitmap.createBitmap(raw, 0, 0, raw.width, raw.height, matrix, true)
      } else {
        raw
      }
      val preprocessingEndMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
      if (diagnosticsEnabled) Trace.endSection()

      val mpImage = BitmapImageBuilder(bitmap).build()
      val mediapipeSubmitMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
      if (diagnosticsEnabled) Trace.beginSection("HalePose.mediapipe")
      val start = SystemClock.elapsedRealtime()
      val result = landmarker.detectForVideo(mpImage, timestampMs)
      val inferenceMs = SystemClock.elapsedRealtime() - start
      val mediapipeCallbackMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
      if (diagnosticsEnabled) Trace.endSection()
      val diagnostics = if (diagnosticsEnabled) {
        PoseLatencyDiagnostics(
          frameId = diagnosticFrameId,
          sourceTimestampMs = timestampMs.toDouble(),
          preprocessingStartMs = preprocessingStartMs,
          preprocessingEndMs = preprocessingEndMs,
          mediapipeSubmitMs = mediapipeSubmitMs,
          mediapipeCallbackMs = mediapipeCallbackMs,
        )
      } else {
        null
      }

      // Bitmap is now upright, so its dimensions are the upright source size.
      dispatchResult(result, timestampMs, inferenceMs, bitmap.width, bitmap.height, diagnostics)
    } catch (e: Exception) {
      imageProxy.close()
      mainHandler.post {
        onPoseError(mapOf("message" to "inference-failed: ${e.message}"))
      }
    }
  }

  private fun dispatchResult(
    result: PoseLandmarkerResult,
    timestampMs: Long,
    inferenceMs: Long,
    width: Int,
    height: Int,
    diagnostics: PoseLatencyDiagnostics?,
  ) {
    if (diagnostics != null) Trace.beginSection("HalePose.nativeResultConversion")
    val poses = result.landmarks()
    val flat: DoubleArray
    if (poses.isEmpty()) {
      // Empty landmarks still get an event: the JS pipeline needs frame
      // continuity to drive subject-gone detection.
      flat = DoubleArray(0)
    } else {
      val pose = poses[0]
      flat = DoubleArray(LANDMARK_COUNT * LANDMARK_STRIDE)
      val count = minOf(pose.size, LANDMARK_COUNT)
      for (i in 0 until count) {
        val lm = pose[i]
        val base = i * LANDMARK_STRIDE
        flat[base] = lm.x().toDouble()
        flat[base + 1] = lm.y().toDouble()
        flat[base + 2] = lm.z().toDouble()
        flat[base + 3] = (lm.visibility().orElse(0f)).toDouble()
        flat[base + 4] = (lm.presence().orElse(0f)).toDouble()
      }
    }
    val nativePostprocessEndMs = if (diagnostics != null) nativeNowMs() else 0.0
    if (diagnostics != null) Trace.endSection()
    val latency = diagnostics?.copy(
      nativePostprocessEndMs = nativePostprocessEndMs,
      nativeEventEmitMs = nativeNowMs()
    )
    val payload = mutableMapOf<String, Any>(
      "timestampMs" to timestampMs.toDouble(),
      "landmarks" to flat,
      "inferenceMs" to inferenceMs.toDouble(),
      "sourceWidth" to width,
      "sourceHeight" to height,
    )
    if (latency != null) {
      val sourceAgeAtMediapipeSubmitMs = latency.mediapipeSubmitMs - latency.sourceTimestampMs
      val sourceAgeAtMediapipeCallbackMs = latency.mediapipeCallbackMs - latency.sourceTimestampMs
      val sourceAgeAtNativeEventEmitMs = latency.nativeEventEmitMs - latency.sourceTimestampMs
      payload["latency"] = mapOf(
        "frameId" to latency.frameId.toDouble(),
        "nativeClock" to "android.elapsedRealtimeNanos",
        "sourceTimestampMs" to latency.sourceTimestampMs,
        "preprocessingStartMs" to latency.preprocessingStartMs,
        "preprocessingEndMs" to latency.preprocessingEndMs,
        "mediapipeSubmitMs" to latency.mediapipeSubmitMs,
        "mediapipeCallbackMs" to latency.mediapipeCallbackMs,
        "nativePostprocessEndMs" to latency.nativePostprocessEndMs,
        "nativeEventEmitMs" to latency.nativeEventEmitMs,
        "sourceAgeAtMediapipeSubmitMs" to sourceAgeAtMediapipeSubmitMs,
        "sourceAgeAtMediapipeCallbackMs" to sourceAgeAtMediapipeCallbackMs,
        "sourceAgeAtNativeEventEmitMs" to sourceAgeAtNativeEventEmitMs,
      )
    }
    if (diagnostics != null) Trace.beginSection("HalePose.eventEmit")
    mainHandler.post { onLandmarks(payload) }
    if (diagnostics != null) Trace.endSection()
  }

  private fun createLandmarker(): PoseLandmarker {
    val modelAsset = if (modelVariant == "full") {
      "pose_landmarker_full.task"
    } else {
      "pose_landmarker_lite.task"
    }
    return try {
      createLandmarkerWithDelegate(modelAsset, Delegate.GPU)
    } catch (e: Exception) {
      // GPU delegate fails on some chipsets/emulators; CPU still hits ~30fps
      // with the lite model on most devices.
      mainHandler.post {
        onPoseError(mapOf("message" to "gpu-delegate-failed-falling-back-to-cpu: ${e.message}"))
      }
      createLandmarkerWithDelegate(modelAsset, Delegate.CPU)
    }
  }

  private fun createLandmarkerWithDelegate(modelAsset: String, delegate: Delegate): PoseLandmarker {
    val baseOptions = BaseOptions.builder()
      .setModelAssetPath(modelAsset)
      .setDelegate(delegate)
      .build()
    val options = PoseLandmarker.PoseLandmarkerOptions.builder()
      .setBaseOptions(baseOptions)
      .setRunningMode(RunningMode.VIDEO)
      .setNumPoses(1)
      .setMinPoseDetectionConfidence(minDetectionConfidence)
      .setMinTrackingConfidence(minTrackingConfidence)
      .setMinPosePresenceConfidence(minPresenceConfidence)
      .build()
    return PoseLandmarker.createFromOptions(context, options)
  }

  private fun stop() {
    running = false
    cameraProvider?.unbindAll()
    cameraProvider = null
    lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_PAUSE)
    lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_STOP)
    val executor = analysisExecutor
    analysisExecutor = null
    executor?.execute {
      poseLandmarker?.close()
      poseLandmarker = null
    }
    executor?.shutdown()
  }

  private fun nativeNowMs(): Double {
    return SystemClock.elapsedRealtimeNanos() / 1_000_000.0
  }
}
