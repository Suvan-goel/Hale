const Module = require('node:module');

process.env.EXPO_PUBLIC_SUPABASE_URL ||= 'https://audit.local';
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||= 'audit-key';
global.__DEV__ = false;

const originalLoad = Module._load;

for (const extension of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
  require.extensions[extension] = (module, filename) => {
    module.exports = filename;
  };
}

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'react-native') {
    return {
      AppState: { addEventListener: () => ({ remove: () => undefined }) },
      Linking: {},
      Platform: { OS: 'web', select: (choices) => choices?.web ?? choices?.default },
      StyleSheet: { create: (styles) => styles },
    };
  }
  if (request === '@react-native-async-storage/async-storage') {
    return {
      default: {
        getItem: async () => null,
        setItem: async () => undefined,
        removeItem: async () => undefined,
      },
    };
  }
  if (request === 'react-native-url-polyfill/auto') {
    return {};
  }
  if (request === '@supabase/supabase-js') {
    return {
      createClient: () => ({
        from: () => ({ upsert: async () => ({ error: null }) }),
        auth: {
          startAutoRefresh: () => undefined,
          stopAutoRefresh: () => undefined,
        },
      }),
      processLock: {},
    };
  }
  if (request === '@sentry/react-native') {
    return {
      addBreadcrumb: () => undefined,
      captureException: () => undefined,
      init: () => undefined,
    };
  }
  if (request === 'react-native-svg') {
    const passthrough = () => null;
    return {
      __esModule: true,
      default: passthrough,
      Circle: passthrough,
      Defs: passthrough,
      LinearGradient: passthrough,
      Path: passthrough,
      Rect: passthrough,
      Stop: passthrough,
    };
  }
  if (request === 'expo-modules-core' || request.startsWith('expo-modules-core/')) {
    const passthrough = () => undefined;
    return {
      EventEmitter: class {},
      NativeModule: class {},
      requireNativeModule: () => ({}),
      requireOptionalNativeModule: () => null,
      registerWebModule: passthrough,
    };
  }
  if (request === 'expo' || request.startsWith('expo/')) {
    return {
      requireNativeModule: () => ({}),
      requireNativeView: () => () => null,
    };
  }
  if (request === 'expo-web-browser') {
    return {
      maybeCompleteAuthSession: () => undefined,
      openAuthSessionAsync: async () => ({ type: 'dismiss' }),
      dismissBrowser: () => undefined,
    };
  }
  if (request === 'expo-auth-session') {
    return {
      makeRedirectUri: () => 'hale://audit',
    };
  }
  if (request.startsWith('expo-')) {
    return {};
  }
  return originalLoad.call(this, request, parent, isMain);
};
