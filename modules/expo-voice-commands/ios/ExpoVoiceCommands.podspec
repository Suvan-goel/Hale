Pod::Spec.new do |s|
  s.name           = 'ExpoVoiceCommands'
  s.version        = '0.1.0'
  s.summary        = 'On-device windowed voice-command recognition for Hale voice-guided sessions'
  s.description    = 'SFSpeechRecognizer with requiresOnDeviceRecognition; windowed listening only; no audio stored, nothing leaves the device.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
