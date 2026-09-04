# Contributing to PantryPal

## Prerequisites
- Node.js, Expo
- A Supabase project

## Run
```bash
npm install
cp .env.example .env
# EXPO_PUBLIC_SUPABASE_URL / ANON_KEY
# optional: SPOONACULAR, GOOGLE_CLOUD_VISION
# Apply FINAL_SQL_SCHEMA.sql in Supabase (keep RLS on)
npx expo start
```

## Tests
```bash
npm test
```

Dev mode can skip auth — don't ship with that on.
