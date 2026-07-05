import AVFoundation
import ExpoModulesCore
import Speech

/**
 * Windowed on-device speech command recognition (iOS).
 *
 * Privacy contract (CLAUDE.md audio-law amendment 2026-07-05):
 * `requiresOnDeviceRecognition = true` on every request — if the locale/device
 * cannot recognize on-device this module ERRORS rather than silently using
 * Apple's servers. Listening only inside explicit windows; no audio persisted;
 * transcripts cross to JS transiently for intent matching only.
 *
 * Audio-session ownership (TDD-ADDENDUM N2): this module is the ONLY place
 * that switches the app to .playAndRecord, and only while a window is open.
 * Options chosen for the amendment-2 routing tests: .defaultToSpeaker (bundled
 * voice lines must stay on the loudspeaker — never the earpiece),
 * .mixWithOthers (the app-wide law), .allowBluetoothA2DP (TTS to BT headphones
 * at full quality while capture stays on the PHONE mic — deliberately NOT
 * .allowBluetooth/HFP, whose voice-quality collapse is a known failure mode
 * the spike checks). On window close the app-wide playback-only config is
 * restored.
 */
public class ExpoVoiceCommandsModule: Module {
  private var audioEngine: AVAudioEngine?
  private var recognizer: SFSpeechRecognizer?
  private var request: SFSpeechAudioBufferRecognitionRequest?
  private var task: SFSpeechRecognitionTask?
  private var windowOpen = false
  private var continuous = false
  private var localeId = "en-GB"

  public func definition() -> ModuleDefinition {
    Name("ExpoVoiceCommands")

    Events("onTranscript", "onListeningChange", "onVoiceError")

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      // Both mic and speech-recognition authorization are required; the
      // combined response is granted only when both are.
      AVAudioSession.sharedInstance().requestRecordPermission { micGranted in
        SFSpeechRecognizer.requestAuthorization { speechStatus in
          let granted = micGranted && speechStatus == .authorized
          let canAskAgain = speechStatus == .notDetermined
          promise.resolve([
            "status": granted ? "granted" : "denied",
            "granted": granted,
            "canAskAgain": canAskAgain,
          ])
        }
      }
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      let mic = AVAudioSession.sharedInstance().recordPermission
      let speech = SFSpeechRecognizer.authorizationStatus()
      if mic == .granted && speech == .authorized {
        promise.resolve(["status": "granted", "granted": true, "canAskAgain": true])
      } else if mic == .undetermined || speech == .notDetermined {
        promise.resolve(["status": "undetermined", "granted": false, "canAskAgain": true])
      } else {
        promise.resolve(["status": "denied", "granted": false, "canAskAgain": false])
      }
    }

    AsyncFunction("getOnDeviceAvailabilityAsync") { (locale: String) -> [String: Any] in
      guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale)) else {
        return ["available": false, "reason": "locale_unsupported"]
      }
      guard recognizer.isAvailable else {
        return ["available": false, "reason": "no_recognizer"]
      }
      guard recognizer.supportsOnDeviceRecognition else {
        return ["available": false, "reason": "locale_unsupported"]
      }
      return ["available": true, "reason": "on_device_supported"]
    }

    AsyncFunction("startListeningAsync") { (options: [String: Any?]) in
      try self.startListening(options: options)
    }

    AsyncFunction("stopListeningAsync") {
      self.stopListening(emitStopped: true)
    }

    OnDestroy {
      self.stopListening(emitStopped: false)
    }
  }

  private func startListening(options: [String: Any?]) throws {
    stopListening(emitStopped: false)

    continuous = options["continuous"] as? Bool ?? false
    if let locale = options["locale"] as? String, !locale.isEmpty {
      localeId = locale
    }

    guard let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: localeId)),
          speechRecognizer.isAvailable,
          speechRecognizer.supportsOnDeviceRecognition
    else {
      throw VoiceCommandsError.onDeviceUnavailable(localeId)
    }
    recognizer = speechRecognizer

    let session = AVAudioSession.sharedInstance()
    try session.setCategory(
      .playAndRecord,
      mode: .default,
      options: [.defaultToSpeaker, .mixWithOthers, .allowBluetoothA2DP]
    )
    try session.setActive(true, options: [])

    let engine = AVAudioEngine()
    let recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
    recognitionRequest.shouldReportPartialResults = true
    recognitionRequest.requiresOnDeviceRecognition = true

    let inputNode = engine.inputNode
    let format = inputNode.outputFormat(forBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
      recognitionRequest.append(buffer)
    }
    engine.prepare()
    try engine.start()

    audioEngine = engine
    request = recognitionRequest
    windowOpen = true

    task = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
      guard let self else { return }
      if let result {
        self.sendEvent("onTranscript", [
          "transcript": result.bestTranscription.formattedString,
          "isFinal": result.isFinal,
          "timestampMs": Date().timeIntervalSince1970 * 1000,
        ])
        if result.isFinal {
          self.handleUtteranceEnd(reason: "ended")
          return
        }
      }
      if let error {
        // End-of-utterance/silence surfaces as an error for on-device tasks;
        // inside an open continuous window it is a normal re-arm, not a fault.
        if self.continuous && self.windowOpen {
          self.handleUtteranceEnd(reason: "ended")
        } else if self.windowOpen {
          self.tearDownAudio()
          self.windowOpen = false
          self.sendEvent("onVoiceError", [
            "code": "ios_recognition_error",
            "message": error.localizedDescription,
          ])
          self.sendEvent("onListeningChange", ["listening": false, "reason": "error"])
        }
      }
    }

    sendEvent("onListeningChange", ["listening": true, "reason": "started"])
  }

  /** One utterance finished: re-arm inside a continuous window, else close. */
  private func handleUtteranceEnd(reason: String) {
    if continuous && windowOpen {
      tearDownRecognition()
      do {
        try startRecognitionOnExistingEngine()
      } catch {
        tearDownAudio()
        windowOpen = false
        sendEvent("onVoiceError", [
          "code": "ios_rearm_failed",
          "message": error.localizedDescription,
        ])
        sendEvent("onListeningChange", ["listening": false, "reason": "error"])
      }
    } else {
      stopListening(emitStopped: false)
      sendEvent("onListeningChange", ["listening": false, "reason": reason])
    }
  }

  private func startRecognitionOnExistingEngine() throws {
    guard let engine = audioEngine, let speechRecognizer = recognizer else {
      throw VoiceCommandsError.onDeviceUnavailable(localeId)
    }
    let recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
    recognitionRequest.shouldReportPartialResults = true
    recognitionRequest.requiresOnDeviceRecognition = true
    let inputNode = engine.inputNode
    inputNode.removeTap(onBus: 0)
    let format = inputNode.outputFormat(forBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
      recognitionRequest.append(buffer)
    }
    request = recognitionRequest
    task = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
      guard let self else { return }
      if let result {
        self.sendEvent("onTranscript", [
          "transcript": result.bestTranscription.formattedString,
          "isFinal": result.isFinal,
          "timestampMs": Date().timeIntervalSince1970 * 1000,
        ])
        if result.isFinal {
          self.handleUtteranceEnd(reason: "ended")
          return
        }
      }
      if error != nil, self.windowOpen {
        self.handleUtteranceEnd(reason: "ended")
      }
    }
  }

  private func tearDownRecognition() {
    task?.cancel()
    task = nil
    request?.endAudio()
    request = nil
  }

  private func tearDownAudio() {
    tearDownRecognition()
    if let engine = audioEngine {
      engine.inputNode.removeTap(onBus: 0)
      engine.stop()
    }
    audioEngine = nil
    // Restore the app-wide playback-only configuration (the audio law's
    // resting state: playback, mix-with-others, recording disabled).
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
    try? session.setActive(true, options: [])
  }

  private func stopListening(emitStopped: Bool) {
    let wasOpen = windowOpen
    windowOpen = false
    tearDownAudio()
    if emitStopped && wasOpen {
      sendEvent("onListeningChange", ["listening": false, "reason": "stopped"])
    }
  }
}

enum VoiceCommandsError: Error, LocalizedError {
  case onDeviceUnavailable(String)

  var errorDescription: String? {
    switch self {
    case .onDeviceUnavailable(let locale):
      return "On-device speech recognition is unavailable for locale \(locale); refusing to fall back to server recognition."
    }
  }
}
