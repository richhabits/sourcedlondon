# Sourced London — App (early scaffold)

**Status: not yet built.** This is a real, working [Expo](https://expo.dev) (React Native) starter — the same template `create-expo-app` gives anyone — with no Sourced London-specific code in it yet. It runs, but it's the blank default screen, not a feature.

This exists because `website/app.html` promises an app is "in development." This folder is that development's actual starting point, kept honest: nothing here claims to be a finished feature until it is one.

## Why Expo / React Native

One codebase covers iOS, Android, and web, which matches the "all devices" brief without maintaining three separate native apps. Free and open source — no paid tooling required to build or ship.

## Run it

```bash
cd app
npm run ios      # or: npm run android / npm run web
```

## What's actually planned (see website/app.html for the public-facing version)

- Saved search alerts (push notifications)
- Digital garage (owned/reserved vehicle history)
- Camera-based reg lookup (reuses the `vehicle-lookup` Edge Function already live on the website)
- In-app messaging (reuses the `messages` table already live on the website)
- One-tap reservations (reuses `stripe-checkout`)

Note the pattern: every planned app feature maps to backend work **that already exists** in `supabase/`. The app's job is a native UI on top of it, not a second backend — connect it to the same Supabase project the website uses (see `../SETUP.md`), don't stand up a separate one.

## Before writing real features

- Read `AGENTS.md` in this folder first — Expo's SDK moves fast; check versioned docs before assuming an API still works as remembered.
- Wire branding (colors, fonts from `../BRAND-GUIDE.md`) before building screens, not after.
- This folder has its own `.gitignore` (handles `node_modules/`, `.expo/`, and native signing credentials like `*.jks`/`*.mobileprovision` — never commit those).
