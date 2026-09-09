# Sourced London — App

**Status: real, working v0.1.** This connects to the exact same Supabase project as the website — same
tables, same self-serve architecture, no keys baked in, no mock data. Bundles clean for iOS, Android,
and web (verified with `expo export`).

## What's built

- **Setup screen** — paste your Supabase Project URL + anon key, tested live before it's saved (same
  pattern as `admin.html`'s setup wizard). Stored on-device via `AsyncStorage`, never hardcoded.
- **Vehicles** — pulls `status = 'available'` rows from the real `vehicles` table, pull-to-refresh,
  matches whatever's added in Admin → Vehicles on the website. Empty state when there's nothing listed
  yet — no placeholder cars.
- **Vehicle detail** — full spec, price (or POA), description, photo.
- **Enquire** — writes straight into the real `enquiries` table (`lead_type: 'purchase'`), the same one
  the website's contact form uses — enquiries show up in Admin → Enquiries either way.
- Branded with the real design tokens from `../BRAND-GUIDE.md` (charcoal/ivory/brass) and the real
  typefaces (Bodoni Moda + Manrope, via `@expo-google-fonts`) — not system-font placeholders.

## Run it

```bash
cd app
npm run ios      # or: npm run android / npm run web
```

First launch shows the Setup screen. Point it at the same Supabase project `SETUP.md` walks through for
the website — nothing extra to configure.

## What's genuinely not built yet

These were the original pitch items in `website/app.html` — none of them are faked, they're just not
here yet:

- Push notifications for saved-search alerts
- Digital garage (owned/reserved vehicle history) — needs the `saved_vehicles` table wired in, which
  already exists in `supabase/schema.sql`
- Camera-based reg lookup (reuses the `vehicle-lookup` Edge Function, already live)
- In-app messaging (reuses the `messages` table, already live)
- One-tap reservations via `stripe-checkout` (already live on the website, not yet wired into the app)
- Customer sign-in (the app currently enquires anonymously, like a logged-out website visitor; the
  `account.html` login flow hasn't been ported over)
- Native app icons/splash screen — still Expo's defaults in `assets/`
- App Store / Play Store submission — needs a real Apple Developer / Google Play account, which is a
  cost decision for whoever owns the deployment, not something to assume

## Why this is a real add-on, not a stretch goal

Every screen here is a thin native UI over backend work that's already shipped and tested on the
website — same tables, same RLS, same Edge Functions. There's no second backend to build or maintain;
extending it is UI work, which is what makes it a realistic paid add-on rather than a second project.

## Before writing more features

- Read `AGENTS.md` in this folder first — Expo's SDK moves fast; check versioned docs before assuming
  an API still works as remembered.
- This folder has its own `.gitignore` (handles `node_modules/`, `.expo/`, and native signing
  credentials like `*.jks`/`*.mobileprovision` — never commit those).
