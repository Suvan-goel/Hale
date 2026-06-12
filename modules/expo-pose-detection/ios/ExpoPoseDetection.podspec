Pod::Spec.new do |s|
  s.name           = 'ExpoPoseDetection'
  s.version        = '0.1.0'
  s.summary        = 'Native camera + MediaPipe PoseLandmarker for the Longevity app'
  s.description    = 'Owns the camera and pose inference; emits landmark events to JS. No camera preview is ever rendered.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  # MediaPipeTasksVision does not support tvOS; iOS only.
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'MediaPipeTasksVision', '~> 0.10'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  # Model binaries land here via scripts/download-models.sh (gitignored).
  s.resources = "assets/*.task"
end
