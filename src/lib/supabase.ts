import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required Supabase environment variable ${name}. Set it in your local .env before using the Supabase client.`
    );
  }

  return value;
}

const supabaseUrl = requiredEnv('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabasePublishableKey = requiredEnv(
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
