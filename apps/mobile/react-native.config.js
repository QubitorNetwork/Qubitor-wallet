// react-native-worklets@0.5.2 is present only for its Babel plugin, which
// babel-preset-expo (SDK 52) resolves for the web/desktop bundle. Its Android
// native module targets a newer React Native + the new architecture and fails
// `assertMinimalReactNativeVersionTask` on RN 0.76.5. reanimated 3.16 ships its
// own worklets runtime, so the standalone native module is not needed — exclude
// it from native autolinking so the Android APK can build.
module.exports = {
  dependencies: {
    "react-native-worklets": {
      platforms: { android: null, ios: null },
    },
  },
};
