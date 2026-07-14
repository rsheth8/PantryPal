# 🤝 PantryPal — Handoff & Status

_Last updated: 2026-07-14 · Branch: `claude/app-launch-prep-b4a193` · PR: [#3](https://github.com/rsheth8/PantryPal/pull/3)_

This document is the single source of truth for where PantryPal stands and how to
pick it back up. Read the **Go-live checklist** section when you're ready to plug
in real API keys.

---

## TL;DR

PantryPal is a **launch-ready, feature-rich** React Native (Expo SDK 53) app. Every
advertised feature works, the UI is themed and animated, and the data layer is built
to scale with Supabase (RLS + real-time). **It runs today with zero API keys** —
paid keys only upgrade recipe discovery and receipt OCR to their "live" sources.

- ✅ `npm run build:check` — green (lint + prettier + type-check + tests)
- ✅ `npx expo-doctor` — 17/17 checks pass
- ✅ `npx expo export` — bundles cleanly (~1255 modules)
- ✅ **83 tests** across 11 suites

---

## What's built

### Foundation
- **Theme system** — light / dark / system with a persisted preference and a live
  switcher in Settings. All screens consume semantic tokens via
  `useThemedStyles(createStyles)`.
- **Animated UI kit** (`src/components/ui/`) — `AnimatedPressable`, `FadeSlideIn`,
  `Skeleton`, `EmptyState`, `Toast` (with undo), `Confetti`, `AmbientBackground`
  (parallax "3D" orbs), `ProgressBar`, `ProgressRing`. All on the native-driver
  `Animated` API — no heavy deps.
- **App shell** — `ErrorBoundary`, dev-gated `logger` (no raw `console.*`), animated
  splash, first-run onboarding carousel, single AsyncStorage-backed Supabase client
  so **auth sessions persist across restarts**.

### Core features (all functional)
| Area | Highlights |
| --- | --- |
| **Pantry** | Add/edit/delete/use, quantity steppers, expiry badges, search/filter/sort, undo, sample-data seeding |
| **Scanner** | Live barcode scan (`expo-camera`) + Open Food Facts lookup (no key); **receipt scanning** (photo → OCR → editable review → bulk add) |
| **Recipes** | Detail view with live pantry matching, add form, discovery, favorites, **serving scaling**, **cooking mode** |
| **Shopping** | Quick-add, recipe sync, finish-trip → move to pantry, completion celebration |
| **Meal Planning** | Diet/cuisine prefs, generate + save (persists to Supabase) |
| **Household** | Create/join/leave, invite share, owner settings, **real-time sync**, **activity feed** |
| **Analytics** | Pantry health score, waste score, category breakdown, spend |
| **Achievements** | Tiered badges + daily streaks with progress rings |
| **Global search** | One box over pantry + recipes + shopping, from the Dashboard header 🔍 |
| **Settings** | Theme switcher, notification prefs, data export |

### Scale & collaboration
- **Real-time household sync** (`src/services/realtimeService.ts`) — Supabase Postgres
  change streams scoped per household; the store reconciles by id-upsert. Starts on
  init/create/join, cleaned up on leave/sign-out.
- **RLS + indexes** — `FINAL_SQL_SCHEMA.sql` has all tables, policies, indexes, the
  realtime publication, and idempotent migrations.

---

## Architecture map

```
App.tsx                      Providers (ErrorBoundary→SafeArea→Theme→Toast), boot, splash, onboarding gate
src/
  navigation/                Auth stack; Main tabs; Home stack (Dashboard→MealPlanning/Household/Analytics/Achievements/Activity)
  theme/                     themes.ts (light/dark tokens) + ThemeContext.tsx (useTheme, useThemedStyles)
  components/ui/             Animated UI kit (see above)
  features/<area>/           One folder per feature screen
  services/                  supabaseService (shared client), authService, userService,
                             recipeService, ocrService, barcodeService, realtimeService,
                             achievementsService, notificationService, mealPlanning*
  store/                     useMultiUserStore (main), useEngagementStore (streaks/counters)
  utils/                     helpers, recipeScaling, globalSearch, streak, sampleData, logger, haptics
```

**State:** Zustand. The main store (`useMultiUserStore`) is cleared in dev mode on
boot; engagement counters live in a **separate** always-persisted store
(`useEngagementStore`) so streaks survive.

**Supabase client:** import the single shared instance from `src/config/supabase.ts`.
**Do not** create new clients — it breaks session/realtime consistency.

---

## How to run

```bash
npm install
cp .env.example .env      # fill in keys later; app works without them
npx expo start            # press i / a, or scan with Expo Go
```

Dev convenience: `.env` currently sets `EXPO_PUBLIC_DEV_BYPASS_AUTH=true`, which skips
login in **dev builds only** (double-gated behind `__DEV__` — it can never ship). You'll
land straight in the app. From the empty pantry, tap **"Fill with sample items"** to
populate it instantly.

---

## 🚀 Go-live checklist (when you add API keys)

1. **Supabase**
   - Create a project; copy the URL + anon key into `.env`
     (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
   - Run the **entire** `FINAL_SQL_SCHEMA.sql` in the SQL editor (idempotent — safe to
     re-run). This creates every table, RLS policy, index, and the realtime publication.
   - Confirm Row Level Security is ON for all tables (the schema enables it).
2. **Spoonacular** (recipe discovery) — set `EXPO_PUBLIC_SPOONACULAR_API_KEY`.
   Without it, discovery serves curated mock recipes.
3. **Google Cloud Vision** (receipt OCR) — set `EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY`.
   Without it, receipt scanning uses mock parsing.
4. **Turn off dev bypass for production** — remove/false `EXPO_PUBLIC_DEV_BYPASS_AUTH`
   (it's already inert in production builds, but keep `.env` clean).
5. Restart the dev server after editing `.env` (Expo inlines `EXPO_PUBLIC_*` at build time).
6. Nothing else — no code changes needed. Each service auto-detects its key and
   switches from mock/fallback to live.

**No keys? Still fully usable:** barcode scanning (Open Food Facts) always works;
recipes and OCR fall back to sensible mocks.

---

## Quality gates (keep these green)

```bash
npm run build:check   # lint + format:check + type-check + test
npx expo-doctor       # 17/17
npx expo export --platform ios --output-dir dist-check && rm -rf dist-check
```

Notes:
- The remaining ~65 lint **warnings** are pre-existing (`no-console` in test setup,
  a few `any` types in navigation props) — 0 errors.
- `react-native/no-unused-styles` is disabled on purpose: it false-positives against
  the `createStyles(theme)` factory pattern used everywhere.

---

## Dependencies added this project

`expo-haptics`, `react-native-url-polyfill` (Supabase in RN), `react-native-svg`
(progress rings), `expo-keep-awake` (cooking mode). All installed via `expo install`
so versions match the SDK.

---

## Ideas for next (not yet built)

- Real push notifications for household events (wire the existing `notificationService`
  triggers to Supabase events / a push token registration flow).
- Recipe photo picker (attach an image when creating a recipe).
- Barcode → nutrition tracking (Open Food Facts already returns nutriments).
- Offline mutation queue for spotty connections (buffer writes, flush on reconnect).
- Household roles UI (promote/demote members; `member_roles` table already exists).
- Accessibility audit pass (VoiceOver labels are mostly present; verify focus order).

---

## Commit history (this branch)

The work landed in reviewable, green commits — theme/UI kit → real feature screens →
service hardening → launch prep → achievements → activity feed → real-time sync →
receipt scanning → cooking mode → global search → sample data → docs. See
`git log --oneline master..HEAD`.
