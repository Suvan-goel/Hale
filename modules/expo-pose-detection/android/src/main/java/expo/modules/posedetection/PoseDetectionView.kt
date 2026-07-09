package expo.modules.posedetection

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.hardware.camera2.CameraCharacteristics
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.os.Trace
import android.util.Size
import android.view.Surface
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.Camera
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
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.ImageProcessingOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

private const val LANDMARK_COUNT = 33
private const val LANDMARK_STRIDE = 5
private const val DEFAULT_SKELETON_CONFIDENCE = 0.35
private const val NUM_POSES = 1
private const val DEFAULT_MASK_FIGURE_COLOR = "#CBA89D"
private const val DEFAULT_MODEL_VARIANT = "full"
private const val DEFAULT_MODEL_ASSET = "pose_landmarker_full.task"
private const val DEFAULT_PIPELINE_MODE = "full-video-sync"
private const val LIVE_STREAM_PIPELINE_MODE = "full-live-stream"
private const val DEFAULT_ROTATION_MODE = "rotated-bitmap"
private const val ROTATION_METADATA_MODE = "metadata"
private const val DEFAULT_ANALYSIS_RESOLUTION = "640x480"

private val MEDIAPIPE_POSE_CONNECTIONS = arrayOf(
  intArrayOf(0, 1),
  intArrayOf(1, 2),
  intArrayOf(2, 3),
  intArrayOf(3, 7),
  intArrayOf(0, 4),
  intArrayOf(4, 5),
  intArrayOf(5, 6),
  intArrayOf(6, 8),
  intArrayOf(9, 10),
  intArrayOf(11, 12),
  intArrayOf(11, 13),
  intArrayOf(13, 15),
  intArrayOf(15, 17),
  intArrayOf(15, 19),
  intArrayOf(15, 21),
  intArrayOf(17, 19),
  intArrayOf(12, 14),
  intArrayOf(14, 16),
  intArrayOf(16, 18),
  intArrayOf(16, 20),
  intArrayOf(16, 22),
  intArrayOf(18, 20),
  intArrayOf(11, 23),
  intArrayOf(12, 24),
  intArrayOf(23, 24),
  intArrayOf(23, 25),
  intArrayOf(25, 27),
  intArrayOf(27, 29),
  intArrayOf(29, 31),
  intArrayOf(27, 31),
  intArrayOf(24, 26),
  intArrayOf(26, 28),
  intArrayOf(28, 30),
  intArrayOf(30, 32),
  intArrayOf(28, 32),
)

private data class PoseLatencyDiagnostics(
  val frameId: Long,
  val sourceTimestampMs: Double,
  val preprocessingStartMs: Double,
  val preprocessingEndMs: Double,
  val mediapipeSubmitMs: Double,
  val mediapipeCallbackMs: Double,
  val nativePostprocessEndMs: Double = 0.0,
  val nativeEventEmitMs: Double = 0.0,
  val imageProxyToBitmapMs: Double = 0.0,
  val explicitRotationMs: Double = 0.0,
  val mpImageBuildMs: Double = 0.0,
  val resultFlattenMs: Double = 0.0,
  val eventPayloadBuildMs: Double = 0.0,
  val modelAsset: String,
  val requestedDelegate: String,
  val selectedDelegate: String,
  val gpuDelegateFallback: Boolean,
  val gpuDelegateFailureMessage: String?,
  val runningMode: String,
  val pipelineMode: String,
  val rotationMode: String,
  val analysisTargetWidth: Int,
  val analysisTargetHeight: Int,
  val imageProxyWidth: Int,
  val imageProxyHeight: Int,
  val imageProxyFormat: Int,
  val imageProxyFormatName: String,
  val imageProxyRotationDegrees: Int,
  val imageProcessingRotationDegrees: Int,
  val emittedSourceWidth: Int,
  val emittedSourceHeight: Int,
  val landmarkRotationDegrees: Int,
  val cameraTargetRotation: Int,
  val cameraFacing: String,
  val mirrorState: Boolean,
  val cameraId: String?,
  val sensorTimestampSourceRaw: Int?,
  val sensorTimestampSourceName: String,
  val sensorTimestampComparableToElapsedRealtime: Boolean,
  val mpImageWidth: Int,
  val mpImageHeight: Int,
  val numPoses: Int,
  val outputSegmentationMasks: Boolean,
  val cameraInputFps: Double,
  val acceptedFrameFps: Double,
  val submittedInferenceFps: Double,
  val resultFps: Double,
  val busyFrameDropCount: Long,
  val nativeEventScheduledCount: Long,
  val nativeEventCoalescedCount: Long,
  val nativeEventRejectedCount: Long,
  val nativeEventEmittedCount: Long,
)

private data class PreparedFrame(
  val mpImage: MPImage,
  val imageProcessingOptions: ImageProcessingOptions?,
  val sourceWidth: Int,
  val sourceHeight: Int,
  val mpImageWidth: Int,
  val mpImageHeight: Int,
  val imageProcessingRotationDegrees: Int,
  val landmarkRotationDegrees: Int,
  val preprocessingEndMs: Double,
  val imageProxyToBitmapMs: Double,
  val explicitRotationMs: Double,
  val mpImageBuildMs: Double,
)

private data class PendingInference(
  val generation: Long,
  val frameId: Long,
  val timestampMs: Long,
  val mediapipeSubmitClockMs: Double,
  val sourceWidth: Int,
  val sourceHeight: Int,
  val mpImage: MPImage,
  val imageProcessingOptions: ImageProcessingOptions?,
  val landmarkRotationDegrees: Int,
  val diagnostics: PoseLatencyDiagnostics?,
)

private data class NativePoseEvent(
  val frameId: Long,
  val timestampMs: Long,
  val inferenceMs: Double,
  val width: Int,
  val height: Int,
  val flat: DoubleArray,
  val diagnostics: PoseLatencyDiagnostics?,
)

private data class LandmarkerCreation(
  val landmarker: PoseLandmarker,
  val modelAsset: String,
  val requestedDelegate: String,
  val selectedDelegate: String,
  val gpuDelegateFallback: Boolean,
  val gpuDelegateFailureMessage: String?,
  val runningMode: RunningMode,
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
  private var loadedModelAsset = DEFAULT_MODEL_ASSET
  private var requestedDelegateName = "GPU"
  private var selectedDelegateName = "unknown"
  private var gpuDelegateFallbackOccurred = false
  private var gpuDelegateFailureMessage: String? = null
  private var activeRunningMode = RunningMode.VIDEO
  private var running = false
  private var attached = false
  private var lastTimestampMs = -1L
  private var frameId = 0L
  private var sessionGeneration = 0L
  private val inferenceInFlight = AtomicBoolean(false)
  private val pendingInferenceLock = Any()
  private var pendingInference: PendingInference? = null
  private var lastResultFrameId = 0L
  private val cameraInputRate = FrameRateMeter()
  private val acceptedFrameRate = FrameRateMeter()
  private val submittedInferenceRate = FrameRateMeter()
  private val resultRate = FrameRateMeter()
  private var busyFrameDropCount = 0L
  private var nativeEventScheduledCount = 0L
  private var nativeEventCoalescedCount = 0L
  private var nativeEventRejectedCount = 0L
  private var nativeEventEmittedCount = 0L
  private var cameraTargetRotation = Surface.ROTATION_0
  private var analysisTargetSize = Size(640, 480)
  private var cameraTimestampDiagnostics = androidCameraTimestampDiagnostics(null, null)
  private val rotationMatrix = Matrix()
  private val nativeEventScheduler = LatestNativeEventScheduler<NativePoseEvent>(
    getOrder = { it.frameId },
    schedule = { runnable -> mainHandler.post(runnable) },
    cancelScheduled = { runnable -> mainHandler.removeCallbacks(runnable) },
    emit = { event -> emitNativePoseEvent(event) },
    onEvent = { event -> recordNativeEventSchedulerEvent(event) },
  )
  private val skeletonPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeCap = Paint.Cap.ROUND
    strokeJoin = Paint.Join.ROUND
    color = Color.parseColor("#EEE2DC")
  }
  private val constellationV2OverlayRenderer = ConstellationV2OverlayRenderer(
    context = context,
    nowMs = { nativeNowMs() },
    requestDraw = { postInvalidateOnAnimation() },
  )
  private val segmentationMaskFigureRenderer = SegmentationMaskFigureRenderer(
    requestDraw = { postInvalidateOnAnimation() },
  ).also { renderer ->
    renderer.onExtractionUnavailable = { message ->
      mainHandler.post { onPoseError(mapOf("message" to message)) }
    }
  }
  private var latestSkeletonLandmarks = DoubleArray(0)
  private var latestSkeletonSourceWidth = 1
  private var latestSkeletonSourceHeight = 1

  // Props (defaults mirror the JS-side defaults).
  private var active = false
  private var cameraFacing = "front"
  private var modelVariant = DEFAULT_MODEL_VARIANT
  private var minDetectionConfidence = 0.35f
  private var minTrackingConfidence = 0.35f
  private var minPresenceConfidence = 0.35f
  private var latencyDiagnosticsEnabled = false
  private var segmentationMaskFigureEnabled = false
  private var nativeSkeletonOverlayEnabled = false
  private var nativeBenchmarkOverlayMode = "off"
  private var nativeBenchmarkOverlayResetKey = 0
  private var androidPipelineMode = DEFAULT_PIPELINE_MODE
  private var androidRotationMode = DEFAULT_ROTATION_MODE
  private var androidAnalysisResolution = DEFAULT_ANALYSIS_RESOLUTION

  init {
    // focus-canvas (#101114) - keep in sync with the JS theme token (src/theme).
    setBackgroundColor(Color.parseColor("#101114"))
    setWillNotDraw(false)
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

  fun setSegmentationMaskFigureEnabledProp(value: Boolean) {
    if (segmentationMaskFigureEnabled == value) return
    segmentationMaskFigureEnabled = value
    segmentationMaskFigureRenderer.clear()
    // Landmarker options changed: masks are only produced when requested at creation.
    restartIfRunning()
  }

  fun setSegmentationMaskFigureColorProp(value: String) {
    segmentationMaskFigureRenderer.setColor(
      parseColorOr(value, Color.parseColor(DEFAULT_MASK_FIGURE_COLOR))
    )
    postInvalidateOnAnimation()
  }

  fun setAndroidPipelineModeProp(value: String) {
    val normalized = when (value) {
      LIVE_STREAM_PIPELINE_MODE -> LIVE_STREAM_PIPELINE_MODE
      else -> DEFAULT_PIPELINE_MODE
    }
    if (androidPipelineMode == normalized) return
    androidPipelineMode = normalized
    restartIfRunning()
  }

  fun setAndroidRotationModeProp(value: String) {
    val normalized = when (value) {
      ROTATION_METADATA_MODE -> ROTATION_METADATA_MODE
      else -> DEFAULT_ROTATION_MODE
    }
    if (androidRotationMode == normalized) return
    androidRotationMode = normalized
    restartIfRunning()
  }

  fun setAndroidAnalysisResolutionProp(value: String) {
    val normalized = when (value) {
      "512x384" -> "512x384"
      "480x360" -> "480x360"
      else -> DEFAULT_ANALYSIS_RESOLUTION
    }
    if (androidAnalysisResolution == normalized) return
    androidAnalysisResolution = normalized
    restartIfRunning()
  }

  fun setNativeSkeletonOverlayEnabledProp(value: Boolean) {
    if (nativeSkeletonOverlayEnabled == value) return
    nativeSkeletonOverlayEnabled = value
    if (!value) latestSkeletonLandmarks = DoubleArray(0)
    invalidate()
  }

  fun setNativeSkeletonColorProp(value: String) {
    skeletonPaint.color = parseColorOr(value, Color.parseColor("#EEE2DC"))
    invalidate()
  }

  fun setNativeBenchmarkOverlayModeProp(value: String) {
    val normalized = when (value) {
      ConstellationV2Mode.V2_900.id -> ConstellationV2Mode.V2_900.id
      ConstellationV2Mode.V2_600.id -> ConstellationV2Mode.V2_600.id
      else -> "off"
    }
    if (nativeBenchmarkOverlayMode == normalized) return
    nativeBenchmarkOverlayMode = normalized
    constellationV2OverlayRenderer.setMode(constellationV2ModeFromProp(normalized))
  }

  fun setNativeBenchmarkOverlayResetKeyProp(value: Int) {
    if (nativeBenchmarkOverlayResetKey == value) return
    nativeBenchmarkOverlayResetKey = value
    constellationV2OverlayRenderer.reset()
  }

  fun setCanvasColorProp(value: String) {
    setBackgroundColor(parseColorOr(value, Color.parseColor("#101114")))
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    if (segmentationMaskFigureEnabled) {
      segmentationMaskFigureRenderer.draw(canvas, width, height, cameraFacing != "back")
    }
    constellationV2OverlayRenderer.draw(canvas, width, height, cameraFacing != "back")
    if (!nativeSkeletonOverlayEnabled) return
    drawNativeSkeleton(canvas)
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
    // Hands-free sessions run for minutes with no touches; hold the screen on
    // while the camera is live so the device never dims or locks mid-recording.
    keepScreenOn = true
    lastTimestampMs = -1L
    frameId = 0L
    lastResultFrameId = 0L
    sessionGeneration += 1L
    nativeEventScheduler.reset()
    inferenceInFlight.set(false)
    synchronized(pendingInferenceLock) {
      pendingInference?.mpImage?.close()
      pendingInference = null
    }
    resetDiagnosticsCounters()
    cameraTimestampDiagnostics = androidCameraTimestampDiagnostics(null, null)
    val executor = Executors.newSingleThreadExecutor()
    analysisExecutor = executor

    // Model load is slow (~100ms+); do it off the main thread, then bind the
    // camera on main. The analyzer skips frames until the landmarker exists.
    executor.execute {
      try {
        val creation = createLandmarker()
        poseLandmarker = creation.landmarker
        loadedModelAsset = creation.modelAsset
        requestedDelegateName = creation.requestedDelegate
        selectedDelegateName = creation.selectedDelegate
        gpuDelegateFallbackOccurred = creation.gpuDelegateFallback
        gpuDelegateFailureMessage = creation.gpuDelegateFailureMessage
        activeRunningMode = creation.runningMode
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
        val targetSize = parseAnalysisResolution(androidAnalysisResolution)
        analysisTargetSize = targetSize
        cameraTargetRotation = display?.rotation ?: Surface.ROTATION_0
        val resolutionSelector = ResolutionSelector.Builder()
          .setResolutionStrategy(
            ResolutionStrategy(
              targetSize,
              ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER
            )
          )
          .build()
        val analysis = ImageAnalysis.Builder()
          .setResolutionSelector(resolutionSelector)
          .setTargetRotation(cameraTargetRotation)
          .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
          .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
          .build()
        analysisExecutor?.let { exec ->
          analysis.setAnalyzer(exec) { imageProxy -> processFrame(imageProxy) }
        }
        provider.unbindAll()
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_RESUME)
        val camera = provider.bindToLifecycle(this, selector, analysis)
        updateCameraTimestampDiagnostics(camera)
        onCameraReady(emptyMap())
      } catch (e: Exception) {
        onPoseError(mapOf("message" to "camera-bind-failed: ${e.message}"))
      }
    }, ContextCompat.getMainExecutor(context))
  }

  private fun processFrame(imageProxy: ImageProxy) {
    val nowMs = nativeNowMs()
    cameraInputRate.record(nowMs)
    val landmarker = poseLandmarker
    if (landmarker == null || !running) {
      imageProxy.close()
      return
    }
    if (isLiveStreamMode() && !inferenceInFlight.compareAndSet(false, true)) {
      busyFrameDropCount += 1L
      imageProxy.close()
      return
    }
    try {
      val diagnosticsEnabled = latencyDiagnosticsEnabled
      val currentFrameId = ++frameId
      acceptedFrameRate.record(nowMs)
      val preprocessingStartMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
      if (diagnosticsEnabled) Trace.beginSection("PearlPose.preprocess")
      // Camera timestamps are boottime-monotonic; VIDEO mode requires
      // strictly increasing values.
      var timestampMs = imageProxy.imageInfo.timestamp / 1_000_000L
      if (timestampMs <= lastTimestampMs) timestampMs = lastTimestampMs + 1
      lastTimestampMs = timestampMs
      val imageProxyWidth = imageProxy.width
      val imageProxyHeight = imageProxy.height
      val imageProxyFormat = imageProxy.format
      val imageProxyRotationDegrees = imageProxy.imageInfo.rotationDegrees

      val prepared = prepareFrame(imageProxy, diagnosticsEnabled)
      if (diagnosticsEnabled) Trace.endSection()

      val mediapipeSubmitClockMs = nativeNowMs()
      val mediapipeSubmitMs = if (diagnosticsEnabled) mediapipeSubmitClockMs else 0.0
      submittedInferenceRate.record(mediapipeSubmitClockMs)
      val diagnostics = if (diagnosticsEnabled) {
        buildLatencyDiagnostics(
          frameId = currentFrameId,
          timestampMs = timestampMs,
          preprocessingStartMs = preprocessingStartMs,
          preprocessingEndMs = prepared.preprocessingEndMs,
          mediapipeSubmitMs = mediapipeSubmitMs,
          mediapipeCallbackMs = 0.0,
          imageProxyWidth = imageProxyWidth,
          imageProxyHeight = imageProxyHeight,
          imageProxyFormat = imageProxyFormat,
          imageProxyRotationDegrees = imageProxyRotationDegrees,
          imageProcessingRotationDegrees = prepared.imageProcessingRotationDegrees,
          emittedSourceWidth = prepared.sourceWidth,
          emittedSourceHeight = prepared.sourceHeight,
          landmarkRotationDegrees = prepared.landmarkRotationDegrees,
          mpImageWidth = prepared.mpImageWidth,
          mpImageHeight = prepared.mpImageHeight,
          imageProxyToBitmapMs = prepared.imageProxyToBitmapMs,
          explicitRotationMs = prepared.explicitRotationMs,
          mpImageBuildMs = prepared.mpImageBuildMs,
        )
      } else {
        null
      }

      if (isLiveStreamMode()) {
        synchronized(pendingInferenceLock) {
          pendingInference = PendingInference(
            generation = sessionGeneration,
            frameId = currentFrameId,
            timestampMs = timestampMs,
            mediapipeSubmitClockMs = mediapipeSubmitClockMs,
            sourceWidth = prepared.sourceWidth,
            sourceHeight = prepared.sourceHeight,
            mpImage = prepared.mpImage,
            imageProcessingOptions = prepared.imageProcessingOptions,
            landmarkRotationDegrees = prepared.landmarkRotationDegrees,
            diagnostics = diagnostics,
          )
        }
        if (diagnosticsEnabled) Trace.beginSection("PearlPose.mediapipe")
        try {
          if (prepared.imageProcessingOptions != null) {
            landmarker.detectAsync(
              prepared.mpImage,
              prepared.imageProcessingOptions,
              timestampMs
            )
          } else {
            landmarker.detectAsync(prepared.mpImage, timestampMs)
          }
        } finally {
          if (diagnosticsEnabled) Trace.endSection()
        }
        return
      }

      if (diagnosticsEnabled) Trace.beginSection("PearlPose.mediapipe")
      val start = SystemClock.elapsedRealtime()
      val result = if (prepared.imageProcessingOptions != null) {
        landmarker.detectForVideo(prepared.mpImage, prepared.imageProcessingOptions, timestampMs)
      } else {
        landmarker.detectForVideo(prepared.mpImage, timestampMs)
      }
      val inferenceMs = SystemClock.elapsedRealtime() - start
      val mediapipeCallbackMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
      resultRate.record(if (diagnosticsEnabled) mediapipeCallbackMs else nativeNowMs())
      if (diagnosticsEnabled) Trace.endSection()
      prepared.mpImage.close()
      val completedDiagnostics = diagnostics?.copy(mediapipeCallbackMs = mediapipeCallbackMs)
      dispatchResult(
        frameId = currentFrameId,
        result = result,
        timestampMs = timestampMs,
        inferenceMs = inferenceMs.toDouble(),
        width = prepared.sourceWidth,
        height = prepared.sourceHeight,
        landmarkRotationDegrees = prepared.landmarkRotationDegrees,
        diagnostics = completedDiagnostics,
      )
    } catch (e: Exception) {
      if (isLiveStreamMode()) {
        inferenceInFlight.set(false)
        clearPendingInference(closeImage = true)
      }
      imageProxy.close()
      mainHandler.post {
        onPoseError(mapOf("message" to "inference-failed: ${e.message}"))
      }
    }
  }

  private fun prepareFrame(imageProxy: ImageProxy, diagnosticsEnabled: Boolean): PreparedFrame {
    val rotation = imageProxy.imageInfo.rotationDegrees
    val normalizedRotation = normalizeRotationDegrees(rotation)
    val toBitmapStartMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
    val raw = imageProxy.toBitmap()
    val toBitmapEndMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
    imageProxy.close()

    val rotationStartMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
    val bitmap = if (androidRotationMode == ROTATION_METADATA_MODE || normalizedRotation == 0) {
      raw
    } else {
      rotationMatrix.reset()
      rotationMatrix.postRotate(normalizedRotation.toFloat())
      val rotated = Bitmap.createBitmap(raw, 0, 0, raw.width, raw.height, rotationMatrix, true)
      raw.recycle()
      rotated
    }
    val rotationEndMs = if (diagnosticsEnabled) nativeNowMs() else 0.0

    val mpImageBuildStartMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
    val mpImage = BitmapImageBuilder(bitmap).build()
    val mpImageBuildEndMs = if (diagnosticsEnabled) nativeNowMs() else 0.0
    val sourceDimensions = if (androidRotationMode == ROTATION_METADATA_MODE) {
      uprightSourceDimensions(raw.width, raw.height, normalizedRotation)
    } else {
      AndroidPoseFrameDimensions(width = bitmap.width, height = bitmap.height)
    }
    val imageProcessingRotationDegrees = if (androidRotationMode == ROTATION_METADATA_MODE) {
      normalizedRotation
    } else {
      0
    }
    val landmarkRotationDegrees = if (androidRotationMode == ROTATION_METADATA_MODE) {
      normalizedRotation
    } else {
      0
    }
    val imageProcessingOptions = if (
      androidRotationMode == ROTATION_METADATA_MODE &&
      imageProcessingRotationDegrees != 0
    ) {
      ImageProcessingOptions.builder()
        .setRotationDegrees(imageProcessingRotationDegrees)
        .build()
    } else {
      null
    }

    return PreparedFrame(
      mpImage = mpImage,
      imageProcessingOptions = imageProcessingOptions,
      sourceWidth = sourceDimensions.width,
      sourceHeight = sourceDimensions.height,
      mpImageWidth = mpImage.getWidth(),
      mpImageHeight = mpImage.getHeight(),
      imageProcessingRotationDegrees = imageProcessingRotationDegrees,
      landmarkRotationDegrees = landmarkRotationDegrees,
      preprocessingEndMs = if (diagnosticsEnabled) mpImageBuildEndMs else 0.0,
      imageProxyToBitmapMs = if (diagnosticsEnabled) toBitmapEndMs - toBitmapStartMs else 0.0,
      explicitRotationMs = if (
        diagnosticsEnabled &&
        androidRotationMode != ROTATION_METADATA_MODE &&
        normalizedRotation != 0
      ) {
        rotationEndMs - rotationStartMs
      } else {
        0.0
      },
      mpImageBuildMs = if (diagnosticsEnabled) mpImageBuildEndMs - mpImageBuildStartMs else 0.0,
    )
  }

  private fun onLiveStreamResult(result: PoseLandmarkerResult, input: MPImage) {
    val pending = clearPendingInference(closeImage = false)
    input.close()
    inferenceInFlight.set(false)
    if (pending == null || !running || pending.generation != sessionGeneration) return
    if (pending.frameId <= lastResultFrameId) {
      nativeEventRejectedCount += 1L
      return
    }
    lastResultFrameId = pending.frameId
    val callbackMs = nativeNowMs()
    resultRate.record(callbackMs)
    val completedDiagnostics = pending.diagnostics?.copy(
      mediapipeCallbackMs = callbackMs,
    )
    dispatchResult(
      frameId = pending.frameId,
      result = result,
      timestampMs = pending.timestampMs,
      inferenceMs = if (completedDiagnostics != null) {
        completedDiagnostics.mediapipeCallbackMs - completedDiagnostics.mediapipeSubmitMs
      } else {
        callbackMs - pending.mediapipeSubmitClockMs
      },
      width = pending.sourceWidth,
      height = pending.sourceHeight,
      landmarkRotationDegrees = pending.landmarkRotationDegrees,
      diagnostics = completedDiagnostics,
    )
  }

  private fun onLiveStreamError(error: RuntimeException) {
    clearPendingInference(closeImage = true)
    inferenceInFlight.set(false)
    mainHandler.post {
      onPoseError(mapOf("message" to "inference-failed: ${error.message}"))
    }
  }

  private fun dispatchResult(
    frameId: Long,
    result: PoseLandmarkerResult,
    timestampMs: Long,
    inferenceMs: Double,
    width: Int,
    height: Int,
    landmarkRotationDegrees: Int,
    diagnostics: PoseLatencyDiagnostics?,
  ) {
    if (diagnostics != null) Trace.beginSection("PearlPose.nativeResultConversion")
    val flattenStartMs = if (diagnostics != null) nativeNowMs() else 0.0
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
        val x = lm.x().toDouble()
        val y = lm.y().toDouble()
        // Metadata rotation orients MediaPipe inference, but landmarks are still
        // normalized in MPImage space. Pearl emits upright, unmirrored x/y.
        flat[base] = uprightNormalizedX(x, y, landmarkRotationDegrees)
        flat[base + 1] = uprightNormalizedY(x, y, landmarkRotationDegrees)
        flat[base + 2] = lm.z().toDouble()
        flat[base + 3] = (lm.visibility().orElse(0f)).toDouble()
        flat[base + 4] = (lm.presence().orElse(0f)).toDouble()
      }
    }
    val flattenEndMs = if (diagnostics != null) nativeNowMs() else 0.0
    val nativePostprocessEndMs = if (diagnostics != null) flattenEndMs else 0.0
    if (diagnostics != null) Trace.endSection()
    val latency = diagnostics?.copy(
      nativePostprocessEndMs = nativePostprocessEndMs,
      resultFlattenMs = flattenEndMs - flattenStartMs,
    )
    if (segmentationMaskFigureEnabled) {
      // Extract synchronously: in live-stream mode the mask images are only
      // valid inside the result callback. The result owns the mask MPImages;
      // they are ByteBuffer-backed and GC-managed, so they are not closed here.
      val masks = result.segmentationMasks()
      val maskList = if (masks.isPresent) masks.get() else null
      if (flat.isEmpty() || maskList.isNullOrEmpty()) {
        segmentationMaskFigureRenderer.submitNoSubject()
      } else {
        segmentationMaskFigureRenderer.submitMask(
          mask = maskList[0],
          rotationDegrees = landmarkRotationDegrees,
          uprightWidth = width,
          uprightHeight = height,
        )
      }
    }
    constellationV2OverlayRenderer.submitPose(
      frameId = frameId,
      sourceTimestampMs = timestampMs.toDouble(),
      sourceWidth = width,
      sourceHeight = height,
      landmarks = flat,
    )
    nativeEventScheduler.submit(
      NativePoseEvent(
        frameId = frameId,
        timestampMs = timestampMs,
        inferenceMs = inferenceMs,
        width = width,
        height = height,
        flat = flat,
        diagnostics = latency,
      )
    )
  }

  private fun emitNativePoseEvent(event: NativePoseEvent) {
    val diagnostics = event.diagnostics
    if (diagnostics != null) Trace.beginSection("PearlPose.eventEmit")
    val payloadStartMs = if (diagnostics != null) nativeNowMs() else 0.0
    val payload = mutableMapOf<String, Any>(
      "timestampMs" to event.timestampMs.toDouble(),
      "landmarks" to event.flat,
      "inferenceMs" to event.inferenceMs,
      "sourceWidth" to event.width,
      "sourceHeight" to event.height,
    )
    if (diagnostics != null) {
      val nativeEventEmitMs = nativeNowMs()
      val latency = diagnostics.copy(
        nativeEventEmitMs = nativeEventEmitMs,
        eventPayloadBuildMs = nativeEventEmitMs - payloadStartMs,
      )
      payload["latency"] = latencyPayload(latency)
    }
    updateNativeSkeleton(event.flat, event.width, event.height)
    onLandmarks(payload)
    if (diagnostics != null) Trace.endSection()
  }

  private fun buildLatencyDiagnostics(
    frameId: Long,
    timestampMs: Long,
    preprocessingStartMs: Double,
    preprocessingEndMs: Double,
    mediapipeSubmitMs: Double,
    mediapipeCallbackMs: Double,
    imageProxyWidth: Int,
    imageProxyHeight: Int,
    imageProxyFormat: Int,
    imageProxyRotationDegrees: Int,
    imageProcessingRotationDegrees: Int,
    emittedSourceWidth: Int,
    emittedSourceHeight: Int,
    landmarkRotationDegrees: Int,
    mpImageWidth: Int,
    mpImageHeight: Int,
    imageProxyToBitmapMs: Double,
    explicitRotationMs: Double,
    mpImageBuildMs: Double,
  ): PoseLatencyDiagnostics {
    return PoseLatencyDiagnostics(
      frameId = frameId,
      sourceTimestampMs = timestampMs.toDouble(),
      preprocessingStartMs = preprocessingStartMs,
      preprocessingEndMs = preprocessingEndMs,
      mediapipeSubmitMs = mediapipeSubmitMs,
      mediapipeCallbackMs = mediapipeCallbackMs,
      imageProxyToBitmapMs = imageProxyToBitmapMs,
      explicitRotationMs = explicitRotationMs,
      mpImageBuildMs = mpImageBuildMs,
      modelAsset = loadedModelAsset,
      requestedDelegate = requestedDelegateName,
      selectedDelegate = selectedDelegateName,
      gpuDelegateFallback = gpuDelegateFallbackOccurred,
      gpuDelegateFailureMessage = gpuDelegateFailureMessage,
      runningMode = activeRunningMode.name,
      pipelineMode = androidPipelineMode,
      rotationMode = androidRotationMode,
      analysisTargetWidth = analysisTargetSize.width,
      analysisTargetHeight = analysisTargetSize.height,
      imageProxyWidth = imageProxyWidth,
      imageProxyHeight = imageProxyHeight,
      imageProxyFormat = imageProxyFormat,
      imageProxyFormatName = imageFormatName(imageProxyFormat),
      imageProxyRotationDegrees = imageProxyRotationDegrees,
      imageProcessingRotationDegrees = imageProcessingRotationDegrees,
      emittedSourceWidth = emittedSourceWidth,
      emittedSourceHeight = emittedSourceHeight,
      landmarkRotationDegrees = landmarkRotationDegrees,
      cameraTargetRotation = cameraTargetRotation,
      cameraFacing = cameraFacing,
      mirrorState = cameraFacing != "back",
      cameraId = cameraTimestampDiagnostics.cameraId,
      sensorTimestampSourceRaw = cameraTimestampDiagnostics.sensorTimestampSourceRaw,
      sensorTimestampSourceName = cameraTimestampDiagnostics.sensorTimestampSourceName,
      sensorTimestampComparableToElapsedRealtime =
        cameraTimestampDiagnostics.sensorTimestampComparableToElapsedRealtime,
      mpImageWidth = mpImageWidth,
      mpImageHeight = mpImageHeight,
      numPoses = NUM_POSES,
      outputSegmentationMasks = segmentationMaskFigureEnabled,
      cameraInputFps = cameraInputRate.hz(nativeNowMs()),
      acceptedFrameFps = acceptedFrameRate.hz(nativeNowMs()),
      submittedInferenceFps = submittedInferenceRate.hz(nativeNowMs()),
      resultFps = resultRate.hz(nativeNowMs()),
      busyFrameDropCount = busyFrameDropCount,
      nativeEventScheduledCount = nativeEventScheduledCount,
      nativeEventCoalescedCount = nativeEventCoalescedCount,
      nativeEventRejectedCount = nativeEventRejectedCount,
      nativeEventEmittedCount = nativeEventEmittedCount,
    )
  }

  private fun latencyPayload(latency: PoseLatencyDiagnostics): Map<String, Any?> {
    val sourceAgeAtMediapipeSubmitMs = latency.mediapipeSubmitMs - latency.sourceTimestampMs
    val sourceAgeAtMediapipeCallbackMs = latency.mediapipeCallbackMs - latency.sourceTimestampMs
    val sourceAgeAtNativeEventEmitMs = latency.nativeEventEmitMs - latency.sourceTimestampMs
    val payload = mutableMapOf<String, Any?>(
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
      "imageProxyToBitmapMs" to latency.imageProxyToBitmapMs,
      "explicitRotationMs" to latency.explicitRotationMs,
      "mpImageBuildMs" to latency.mpImageBuildMs,
      "resultFlattenMs" to latency.resultFlattenMs,
      "eventPayloadBuildMs" to latency.eventPayloadBuildMs,
      "modelAsset" to latency.modelAsset,
      "requestedDelegate" to latency.requestedDelegate,
      "selectedDelegate" to latency.selectedDelegate,
      "gpuDelegateFallback" to latency.gpuDelegateFallback,
      "gpuDelegateFailureMessage" to (latency.gpuDelegateFailureMessage ?: ""),
      "runningMode" to latency.runningMode,
      "pipelineMode" to latency.pipelineMode,
      "rotationMode" to latency.rotationMode,
      "analysisTargetWidth" to latency.analysisTargetWidth,
      "analysisTargetHeight" to latency.analysisTargetHeight,
      "imageProxyWidth" to latency.imageProxyWidth,
      "imageProxyHeight" to latency.imageProxyHeight,
      "imageProxyFormat" to latency.imageProxyFormat,
      "imageProxyFormatName" to latency.imageProxyFormatName,
      "imageProxyRotationDegrees" to latency.imageProxyRotationDegrees,
      "imageProcessingRotationDegrees" to latency.imageProcessingRotationDegrees,
      "emittedSourceWidth" to latency.emittedSourceWidth,
      "emittedSourceHeight" to latency.emittedSourceHeight,
      "landmarkRotationDegrees" to latency.landmarkRotationDegrees,
      "cameraTargetRotation" to latency.cameraTargetRotation,
      "cameraFacing" to latency.cameraFacing,
      "mirrorState" to latency.mirrorState,
      "cameraId" to latency.cameraId,
      "sensorTimestampSourceRaw" to latency.sensorTimestampSourceRaw,
      "sensorTimestampSourceName" to latency.sensorTimestampSourceName,
      "sensorTimestampComparableToElapsedRealtime" to
        latency.sensorTimestampComparableToElapsedRealtime,
      "mpImageWidth" to latency.mpImageWidth,
      "mpImageHeight" to latency.mpImageHeight,
      "numPoses" to latency.numPoses,
      "outputSegmentationMasks" to latency.outputSegmentationMasks,
      "cameraInputFps" to latency.cameraInputFps,
      "acceptedFrameFps" to latency.acceptedFrameFps,
      "submittedInferenceFps" to latency.submittedInferenceFps,
      "resultFps" to latency.resultFps,
      "busyFrameDropCount" to latency.busyFrameDropCount.toDouble(),
      "nativeEventScheduledCount" to latency.nativeEventScheduledCount.toDouble(),
      "nativeEventCoalescedCount" to latency.nativeEventCoalescedCount.toDouble(),
      "nativeEventRejectedCount" to latency.nativeEventRejectedCount.toDouble(),
      "nativeEventEmittedCount" to latency.nativeEventEmittedCount.toDouble(),
    )
    val nativeRenderer = constellationV2OverlayRenderer.diagnosticsPayload()
    if (nativeRenderer != null) payload["nativeRenderer"] = nativeRenderer
    return payload
  }

  private fun clearPendingInference(closeImage: Boolean): PendingInference? {
    synchronized(pendingInferenceLock) {
      val pending = pendingInference
      pendingInference = null
      if (closeImage) pending?.mpImage?.close()
      return pending
    }
  }

  private fun recordNativeEventSchedulerEvent(event: LatestNativeEvent) {
    when (event.type) {
      LatestNativeEventType.SCHEDULED -> nativeEventScheduledCount += 1L
      LatestNativeEventType.COALESCED -> nativeEventCoalescedCount += 1L
      LatestNativeEventType.REJECTED -> nativeEventRejectedCount += 1L
      LatestNativeEventType.EMITTED -> nativeEventEmittedCount += 1L
      LatestNativeEventType.CANCELLED -> Unit
    }
  }

  private fun updateNativeSkeleton(flat: DoubleArray, width: Int, height: Int) {
    if (!nativeSkeletonOverlayEnabled) return
    latestSkeletonLandmarks = flat
    latestSkeletonSourceWidth = width.coerceAtLeast(1)
    latestSkeletonSourceHeight = height.coerceAtLeast(1)
    invalidate()
  }

  private fun drawNativeSkeleton(canvas: Canvas) {
    val landmarks = latestSkeletonLandmarks
    if (landmarks.size < LANDMARK_COUNT * LANDMARK_STRIDE || width <= 0 || height <= 0) return
    val viewWidth = width.toFloat()
    val viewHeight = height.toFloat()
    val sourceAspect = latestSkeletonSourceWidth.toFloat() / latestSkeletonSourceHeight.toFloat()
    val viewAspect = viewWidth / viewHeight
    val useWidth = viewAspect < sourceAspect
    val sx: Float
    val sy: Float
    val ox: Float
    val oy: Float
    if (useWidth) {
      sx = viewWidth
      sy = viewWidth / sourceAspect
      ox = 0f
      oy = (viewHeight - sy) / 2f
    } else {
      sy = viewHeight
      sx = viewHeight * sourceAspect
      ox = (viewWidth - sx) / 2f
      oy = 0f
    }
    val mirrored = cameraFacing != "back"
    skeletonPaint.strokeWidth = maxOf(2.4f, minOf(5.2f, minOf(viewWidth, viewHeight) * 0.008f))
    for (connection in MEDIAPIPE_POSE_CONNECTIONS) {
      val a = connection[0]
      val b = connection[1]
      if (!landmarkRenderable(landmarks, a) || !landmarkRenderable(landmarks, b)) continue
      val ax = mapLandmarkX(landmarks, a, mirrored, sx, ox)
      val ay = mapLandmarkY(landmarks, a, sy, oy)
      val bx = mapLandmarkX(landmarks, b, mirrored, sx, ox)
      val by = mapLandmarkY(landmarks, b, sy, oy)
      canvas.drawLine(ax, ay, bx, by, skeletonPaint)
    }
  }

  private fun landmarkRenderable(landmarks: DoubleArray, landmark: Int): Boolean {
    val base = landmark * LANDMARK_STRIDE
    val x = landmarks[base]
    val y = landmarks[base + 1]
    if (!x.isFinite() || !y.isFinite()) return false
    val visibility = landmarks[base + 3].coerceIn(0.0, 1.0)
    val presence = landmarks[base + 4].coerceIn(0.0, 1.0)
    return minOf(visibility, presence) >= DEFAULT_SKELETON_CONFIDENCE
  }

  private fun mapLandmarkX(
    landmarks: DoubleArray,
    landmark: Int,
    mirrored: Boolean,
    sx: Float,
    ox: Float,
  ): Float {
    val normalized = landmarks[landmark * LANDMARK_STRIDE]
    val x = displayNormalizedX(normalized, mirrored)
    return (x * sx + ox).toFloat()
  }

  private fun mapLandmarkY(landmarks: DoubleArray, landmark: Int, sy: Float, oy: Float): Float {
    return (landmarks[landmark * LANDMARK_STRIDE + 1] * sy + oy).toFloat()
  }

  private fun parseColorOr(value: String, fallback: Int): Int {
    return try {
      Color.parseColor(value)
    } catch (_: IllegalArgumentException) {
      fallback
    }
  }

  private fun createLandmarker(): LandmarkerCreation {
    val modelAsset = if (modelVariant == "full") {
      "pose_landmarker_full.task"
    } else {
      "pose_landmarker_lite.task"
    }
    val runningMode = if (isLiveStreamMode()) RunningMode.LIVE_STREAM else RunningMode.VIDEO
    return try {
      LandmarkerCreation(
        landmarker = createLandmarkerWithDelegate(modelAsset, Delegate.GPU, runningMode),
        modelAsset = modelAsset,
        requestedDelegate = "GPU",
        selectedDelegate = "GPU",
        gpuDelegateFallback = false,
        gpuDelegateFailureMessage = null,
        runningMode = runningMode,
      )
    } catch (e: Exception) {
      // GPU delegate fails on some chipsets/emulators. Record the actual
      // fallback path; diagnostics must never silently claim GPU is active.
      mainHandler.post {
        onPoseError(mapOf("message" to "gpu-delegate-failed-falling-back-to-cpu: ${e.message}"))
      }
      LandmarkerCreation(
        landmarker = createLandmarkerWithDelegate(modelAsset, Delegate.CPU, runningMode),
        modelAsset = modelAsset,
        requestedDelegate = "GPU",
        selectedDelegate = "CPU",
        gpuDelegateFallback = true,
        gpuDelegateFailureMessage = e.message,
        runningMode = runningMode,
      )
    }
  }

  private fun createLandmarkerWithDelegate(
    modelAsset: String,
    delegate: Delegate,
    runningMode: RunningMode,
  ): PoseLandmarker {
    val baseOptions = BaseOptions.builder()
      .setModelAssetPath(modelAsset)
      .setDelegate(delegate)
      .build()
    val builder = PoseLandmarker.PoseLandmarkerOptions.builder()
      .setBaseOptions(baseOptions)
      .setRunningMode(runningMode)
      .setNumPoses(NUM_POSES)
      .setMinPoseDetectionConfidence(minDetectionConfidence)
      .setMinTrackingConfidence(minTrackingConfidence)
      .setMinPosePresenceConfidence(minPresenceConfidence)
      .setOutputSegmentationMasks(segmentationMaskFigureEnabled)
    if (runningMode == RunningMode.LIVE_STREAM) {
      builder
        .setResultListener { result, input -> onLiveStreamResult(result, input) }
        .setErrorListener { error -> onLiveStreamError(error) }
    }
    val options = builder.build()
    return PoseLandmarker.createFromOptions(context, options)
  }

  private fun isLiveStreamMode(): Boolean {
    return androidPipelineMode == LIVE_STREAM_PIPELINE_MODE
  }

  private fun parseAnalysisResolution(value: String): Size {
    return when (value) {
      "512x384" -> Size(512, 384)
      "480x360" -> Size(480, 360)
      else -> Size(640, 480)
    }
  }

  private fun resetDiagnosticsCounters() {
    cameraInputRate.reset()
    acceptedFrameRate.reset()
    submittedInferenceRate.reset()
    resultRate.reset()
    busyFrameDropCount = 0L
    nativeEventScheduledCount = 0L
    nativeEventCoalescedCount = 0L
    nativeEventRejectedCount = 0L
    nativeEventEmittedCount = 0L
  }

  private fun updateCameraTimestampDiagnostics(camera: Camera) {
    cameraTimestampDiagnostics = try {
      val camera2Info = Camera2CameraInfo.from(camera.cameraInfo)
      androidCameraTimestampDiagnostics(
        cameraId = camera2Info.cameraId,
        sensorTimestampSource = camera2Info.getCameraCharacteristic(
          CameraCharacteristics.SENSOR_INFO_TIMESTAMP_SOURCE
        ),
      )
    } catch (_: Exception) {
      androidCameraTimestampDiagnostics(null, null)
    }
  }

  private fun stop() {
    running = false
    keepScreenOn = false
    sessionGeneration += 1L
    nativeEventScheduler.cancel()
    constellationV2OverlayRenderer.reset()
    segmentationMaskFigureRenderer.clear()
    inferenceInFlight.set(false)
    clearPendingInference(closeImage = true)
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

private class FrameRateMeter(
  private val capacity: Int = 120,
) {
  private val times = DoubleArray(capacity)
  private var nextIndex = 0
  private var count = 0

  fun record(nowMs: Double) {
    times[nextIndex] = nowMs
    nextIndex = (nextIndex + 1) % capacity
    if (count < capacity) count += 1
  }

  fun hz(nowMs: Double): Double {
    if (count < 2) return 0.0
    var oldest = Double.POSITIVE_INFINITY
    var newest = Double.NEGATIVE_INFINITY
    for (i in 0 until count) {
      val value = times[i]
      if (value < oldest) oldest = value
      if (value > newest) newest = value
    }
    val spanMs = maxOf(1.0, minOf(newest, nowMs) - oldest)
    return ((count - 1) * 1000.0) / spanMs
  }

  fun reset() {
    nextIndex = 0
    count = 0
  }
}
