// Config plugin: keep MediaPipe .task model files uncompressed in the APK.
// MediaPipe mmaps model assets; Deflate-compressed assets fail to load at
// runtime. Library-level androidResources doesn't govern final APK packaging,
// so this must be injected into the generated app build.gradle (CNG).
const { withAppBuildGradle } = require('expo/config-plugins');

const NO_COMPRESS_BLOCK = `    androidResources {
        noCompress += ["task", "tflite"]
    }
`;

module.exports = function withPoseModelNoCompress(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    const { contents } = gradleConfig.modResults;
    if (!contents.includes('noCompress += ["task"')) {
      gradleConfig.modResults.contents = contents.replace(
        /android\s*\{\n/,
        `android {\n${NO_COMPRESS_BLOCK}`
      );
    }
    return gradleConfig;
  });
};
