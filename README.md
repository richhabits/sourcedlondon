# Cleardrive — Self-Serve Luxury Vehicle Sales Template

A full site + admin panel + customer accounts + payments + AI assistant, built to be **sold or handed to a client as a template**: nobody's API keys are baked in. Each deployment connects its own free Supabase project, its own Stripe test account, and its own free AI key from the admin panel — see **`SETUP.md`** for the ~15-minute activation walkthrough.

## How to preview right now (no setup required)

```
open "website/index.html"
```

Everything renders with realistic placeholder content out of the box — no backend needed to look at it. It only becomes "live" (real data, real accounts, real payments) once someone runs through `SETUP.md`.

## What's here

```
website/
  index.html, vehicles.html, about.html, reviews.html, contact.html   Public site
  admin.html            Admin panel: setup wizard, login, Vehicles/Testimonials/
                         Enquiries/Reservations/Settings CRUD, AI draft tools
  account.html          Customer signup/login, tracked enquiries, saved vehicles,
                         test-mode deposit payments
  assets/css/style.css  Full design system (site + admin + account)
  assets/js/
    main.js             Nav, filters, scroll reveal, WhatsApp/email enquiry form
    supabase-client.js  Reads the buyer's own backend config, exposes one shared client
    data.js             Loads live vehicles/testimonials/settings once connected
                         (falls back to the static placeholder content until then)
    admin.js            Admin panel logic
    account.js          Customer auth + dashboard logic
    chat-widget.js       Floating AI concierge chat (customer-facing)
    save-vehicle.js      "Save vehicle" heart button, ties into customer accounts

supabase/
  schema.sql            Full DB schema + Row Level Security — run once per deployment
  functions/
    ai-proxy/            Edge Function: proxies to a free Gemini API key (kept server-side)
    stripe-checkout/     Edge Function: creates a Stripe Checkout session (test mode by default)

SETUP.md      Step-by-step activation guide (Supabase, Stripe, AI) — start here to go live
BRAND-GUIDE.md Logo, type, color, photography do's/don'ts
```

## Architecture, briefly

- **Nothing costs money until you turn it on.** The static site works standalone. Supabase, Stripe and the AI key are each opt-in, each free at small scale, and each belongs to whoever runs the deployment — not to whoever built the template.
- **Secrets never touch the browser.** Stripe's secret key and the AI API key live only as Supabase Edge Function secrets; the two Edge Functions (`ai-proxy`, `stripe-checkout`) are the only things that ever see them.
- **The admin panel *is* the setup wizard.** First visit to `admin.html` with no backend connected shows a 5-step Setup screen instead of a login form — paste two values from your Supabase project and the whole site (data, accounts, payments, AI) switches on.
- **Public pages degrade gracefully.** `data.js` only overwrites the built-in placeholder vehicles/testimonials/contact info if a backend is actually connected and returns data — so the template always looks finished, whether or not it's been set up yet.

## Still needed from you and Dre (content, not code)

- [ ] Final brand name (site currently says "Cleardrive" throughout — see `BRAND-GUIDE.md` for the rename steps)
- [ ] Real email, phone/WhatsApp number, and address — entered once the backend is connected, via **Admin → Site Settings** (no more editing JS files by hand)
- [ ] Real logo file, if/when designed (current wordmark costs nothing and needs no replacing until you have one)
- [ ] Real vehicle listings — add these in **Admin → Vehicles** (or bulk-import via the Supabase table editor)
- [ ] Real client testimonials — **Admin → Testimonials**, with each client's permission to publish
- [ ] "About Us" story — still a placeholder paragraph in `about.html`

## Design decisions, briefly

- **Reference:** escalux.co.uk — dark, black/navy, sans-serif only, chauffeur-service tone.
- **Cleardrive differentiation:** charcoal/ivory/brass palette (warmer, less severe), a serif display font (Fraunces) paired with Inter for "quiet luxury," copy repositioned from "status transport" to "trustworthy sales & sourcing."
- **No "Add" button** — removed per your note; vehicle actions are Enquire / Save / WhatsApp.
- **Make + Model as separate fields** on the enquiry form, pre-filled automatically from a vehicle's "Enquire" button.
- **Payments stay in Stripe test mode** until you're ready to go live under a finalized brand/business entity — flipping to real money is a key swap, not a rebuild.
