// Supabase Configuration
//
// The anon (publishable) key is safe to ship in a client app *as long as*
// Row Level Security is enabled on your tables — that is its intended use.
// Prefer setting these in a local `.env` file (see `.env.example`); the
// fallback values below let the demo run out of the box.

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_CONFIG = {
  URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    'https://isgexrmpfjkigfuenlij.supabase.co',
  ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ2V4cm1wZmpraWdmdWVubGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MDUxMDAsImV4cCI6MjA2OTA4MTEwMH0.F03_xQ1Ojt7t4x9ulQpvdIrknzB1_GMZxX1NxtXkGpI',
};

// Single shared Supabase client for the whole app.
//
// React Native has no localStorage, so we explicitly wire AsyncStorage as the
// session store. Without this, auth sessions do not persist across app
// restarts and users are silently logged out on every launch. `detectSessionInUrl`
// is disabled because there is no URL bar in a native app.
export const supabase = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
