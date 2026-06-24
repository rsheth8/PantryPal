// Supabase Configuration
//
// The anon (publishable) key is safe to ship in a client app *as long as*
// Row Level Security is enabled on your tables — that is its intended use.
// Prefer setting these in a local `.env` file (see `.env.example`); the
// fallback values below let the demo run out of the box.

export const SUPABASE_CONFIG = {
  URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    'https://isgexrmpfjkigfuenlij.supabase.co',
  ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ2V4cm1wZmpraWdmdWVubGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MDUxMDAsImV4cCI6MjA2OTA4MTEwMH0.F03_xQ1Ojt7t4x9ulQpvdIrknzB1_GMZxX1NxtXkGpI',
};
