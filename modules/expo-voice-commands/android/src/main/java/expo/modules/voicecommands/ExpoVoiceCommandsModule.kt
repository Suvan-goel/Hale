package expo.modules.voicecommands

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Windowed on-device speech command recognition.
 *
 * Privacy contract (CLAUDE.md audio-law amendment 2026-07-05): listening only
 * inside explicit windows opened by JS, on-device recognition preferred
 * (hard-guaranteed via createOnDeviceSpeechRecognizer on API 31+; requested
 * via EXTRA_PREFER_OFFLINE below that — the spike's airplane-mode pass is the
 * honest availability check), no audio persisted, transcripts only cross the
 * JS boundary transiently for intent matching.
 *
 * All SpeechRecognizer interaction happens on the main thread (a platform
 * requirement).
 */
class ExpoVoiceCommandsModule : Module() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private var recognizer: SpeechRecognizer? = null
  private var windowOpen = false
  private var continuous = false
  private var presenceOnly = false
  private var localeTag = DEFAULT_LOCALE

  override fun definition() = ModuleDefinition {
    Name("ExpoVoiceCommands")

    Events(EVENT_TRANSCRIPT, EVENT_LISTENING_CHANGE, EVENT_ERROR, EVENT_SPEECH_ACTIVITY)

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(
        appContext.permissions,
        promise,
        Manifest.permission.RECORD_AUDIO
      )
    }

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(
        appContext.permissions,
        promise,
        Manifest.permission.RECORD_AUDIO
      )
    }

    AsyncFunction("getOnDeviceAvailabilityAsync") { _: String ->
      availability()
    }

    AsyncFunction("startListeningAsync") { options: Map<String, Any?>, promise: Promise ->
      mainHandler.post {
        try {
          startListening(options)
          promise.resolve(null)
        } catch (t: Throwable) {
          promise.reject("ERR_VOICE_START", t.message ?: "Failed to start listening", t)
        }
      }
    }

    AsyncFunction("stopListeningAsync") { promise: Promise ->
      mainHandler.post {
        stopListening(emitStopped = true)
        promise.resolve(null)
      }
    }

    OnDestroy {
      mainHandler.post { destroyRecognizer() }
    }
  }

  private fun availability(): Map<String, Any> {
    val context = appContext.reactContext
      ?: return mapOf("available" to false, "reason" to "no_recognizer")
    if (!SpeechRecognizer.isRecognitionAvailable(context)) {
      return mapOf("available" to false, "reason" to "no_recognizer")
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
      SpeechRecognizer.isOnDeviceRecognitionAvailable(context)
    ) {
      return mapOf("available" to true, "reason" to "on_device_api")
    }
    return mapOf("available" to true, "reason" to "prefer_offline_fallback")
  }

  private fun startListening(options: Map<String, Any?>) {
    val context = appContext.reactContext ?: throw IllegalStateException("No React context")
    stopListening(emitStopped = false)

    continuous = options["continuous"] == true
    presenceOnly = options["presenceOnly"] == true
    localeTag = (options["locale"] as? String)?.takeIf { it.isNotBlank() } ?: DEFAULT_LOCALE

    val created =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
        SpeechRecognizer.isOnDeviceRecognitionAvailable(context)
      ) {
        SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
      } else {
        SpeechRecognizer.createSpeechRecognizer(context)
      }
    created.setRecognitionListener(listener)
    recognizer = created
    windowOpen = true
    created.startListening(recognitionIntent())
  }

  private fun recognitionIntent(): Intent =
    Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE, localeTag)
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
      putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
    }

  private fun stopListening(emitStopped: Boolean) {
    windowOpen = false
    destroyRecognizer()
    if (emitStopped) emitListening(false, "stopped")
  }

  private fun destroyRecognizer() {
    recognizer?.let {
      runCatching { it.cancel() }
      runCatching { it.destroy() }
    }
    recognizer = null
  }

  /** End-of-utterance inside an open continuous window → immediately re-arm. */
  private fun restartIfContinuous(endReason: String) {
    if (continuous && windowOpen) {
      recognizer?.startListening(recognitionIntent())
        ?: run {
          windowOpen = false
          emitListening(false, endReason)
        }
    } else {
      windowOpen = false
      destroyRecognizer()
      emitListening(false, endReason)
    }
  }

  private fun emitListening(listening: Boolean, reason: String) {
    sendEvent(EVENT_LISTENING_CHANGE, mapOf("listening" to listening, "reason" to reason))
  }

  private fun emitTranscript(results: Bundle?, isFinal: Boolean) {
    val texts = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) ?: return
    val transcript = texts.firstOrNull()?.trim().orEmpty()
    if (transcript.isEmpty()) return
    // Presence-only windows (clarity VAD): text is derived and DISCARDED
    // here — only speaking booleans cross the bridge.
    if (presenceOnly) {
      emitSpeechActivity(speaking = true)
      if (isFinal) emitSpeechActivity(speaking = false)
      return
    }
    sendEvent(
      EVENT_TRANSCRIPT,
      mapOf(
        "transcript" to transcript,
        "isFinal" to isFinal,
        "timestampMs" to System.currentTimeMillis()
      )
    )
  }

  private fun emitSpeechActivity(speaking: Boolean) {
    sendEvent(
      EVENT_SPEECH_ACTIVITY,
      mapOf("speaking" to speaking, "timestampMs" to System.currentTimeMillis())
    )
  }

  private val listener = object : RecognitionListener {
    override fun onReadyForSpeech(params: Bundle?) {
      emitListening(true, "started")
    }

    override fun onPartialResults(partialResults: Bundle?) {
      emitTranscript(partialResults, isFinal = false)
    }

    override fun onResults(results: Bundle?) {
      emitTranscript(results, isFinal = true)
      restartIfContinuous("ended")
    }

    override fun onError(error: Int) {
      when (error) {
        // Normal ends of a quiet window — not user-facing errors.
        SpeechRecognizer.ERROR_NO_MATCH,
        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> restartIfContinuous("ended")
        else -> {
          windowOpen = false
          destroyRecognizer()
          sendEvent(
            EVENT_ERROR,
            mapOf("code" to "android_error_$error", "message" to errorMessage(error))
          )
          emitListening(false, "error")
        }
      }
    }

    override fun onBeginningOfSpeech() {
      if (presenceOnly) emitSpeechActivity(speaking = true)
    }
    override fun onRmsChanged(rmsdB: Float) = Unit
    override fun onBufferReceived(buffer: ByteArray?) = Unit
    override fun onEndOfSpeech() {
      if (presenceOnly) emitSpeechActivity(speaking = false)
    }
    override fun onEvent(eventType: Int, params: Bundle?) = Unit
  }

  private fun errorMessage(error: Int): String = when (error) {
    SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
    SpeechRecognizer.ERROR_CLIENT -> "Client error"
    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Missing record-audio permission"
    SpeechRecognizer.ERROR_NETWORK -> "Network error (on-device path expected)"
    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout (on-device path expected)"
    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
    SpeechRecognizer.ERROR_SERVER -> "Server error (on-device path expected)"
    SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED -> "Language not supported"
    SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> "Language pack unavailable"
    else -> "Speech recognition error $error"
  }

  private companion object {
    const val EVENT_TRANSCRIPT = "onTranscript"
    const val EVENT_LISTENING_CHANGE = "onListeningChange"
    const val EVENT_ERROR = "onVoiceError"
    const val EVENT_SPEECH_ACTIVITY = "onSpeechActivity"
    const val DEFAULT_LOCALE = "en-GB"
  }
}
