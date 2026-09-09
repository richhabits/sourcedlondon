# Sourced London — Self-Serve Luxury Vehicle Sales Template

A full site + admin panel + customer accounts + payments + multi-provider AI assistant + UK reg/MOT lookup, built to be **sold or handed to a client as a template**: nobody's API keys are baked in. Each deployment connects its own free Supabase project, its own Stripe test account, and its own free AI/DVLA/DVSA keys from the admin panel — see **`SETUP.md`** for the activation walkthrough.

## How to preview right now (no setup required)

```
open "website/index.html"
```

Everything renders with realistic placeholder content out of the box — no backend needed to look at it. It only becomes "live" (real data, real accounts, real payments, real reg lookups) once someone runs through `SETUP.md`.

## What's here

```
website/
  index.html, vehicles.html, about.html, reviews.html, contact.html   Public site
  sell.html             "Sell / Part-Exchange Your Car" — reg lookup pre-fills the form
  admin.html            Admin panel: setup wizard, login, Vehicles/Testimonials/
                         Enquiries/Messages/Reservations/Settings CRUD, AI draft tools
  account.html          Customer signup/login, tracked enquiries, saved vehicles,
                         saved links, in-house messaging, test-mode deposit payments
  assets/css/style.css  Full design system (site + admin + account)
  assets/js/
    main.js             Nav, filters, scroll reveal, WhatsApp/email enquiry form
    supabase-client.js  Reads the buyer's own backend config, exposes one shared client
    data.js             Loads live vehicles/testimonials/settings/compliance once connected
                         (falls back to the static placeholder content until then)
    admin.js            Admin panel logic
    account.js          Customer auth + dashboard logic
    sell.js             Reg lookup + part-exchange lead submission
    chat-widget.js      Floating AI concierge chat (customer-facing)
    save-vehicle.js     "Save vehicle" heart button, ties into customer accounts

supabase/
  schema.sql            Full DB schema + Row Level Security — run once per deployment
  functions/
    ai-proxy/            Edge Function: rotates across Gemini/Groq/OpenRouter free keys
    stripe-checkout/     Edge Function: creates a Stripe Checkout session (test mode by default)
    vehicle-lookup/      Edge Function: DVLA tax/MOT status + DVSA full MOT history by reg plate

SETUP.md      Step-by-step activation guide — start here to go live
BRAND-GUIDE.md Logo, type, color, photography do's/don'ts
```

## Architecture, briefly

- **Nothing costs money until you turn it on.** The static site works standalone. Supabase, Stripe, the AI keys, and the DVLA/DVSA keys are each opt-in, each free at small scale, and each belongs to whoever runs the deployment — not to whoever built the template.
- **Secrets never touch the browser.** Stripe's secret key, AI keys, and DVLA/DVSA credentials live only as Supabase Edge Function secrets; the three Edge Functions are the only things that ever see them.
- **AI has no single point of failure.** `ai-proxy` accepts up to three free-tier provider keys (Gemini, Groq, OpenRouter) and randomly spreads requests across whichever are configured, falling back automatically if one errors or hits its rate limit.
- **The admin panel *is* the setup wizard.** First visit to `admin.html` with no backend connected shows a step-by-step Setup screen instead of a login form — paste two values from your Supabase project and the whole site (data, accounts, payments, AI, reg lookup) switches on.
- **Public pages degrade gracefully.** `data.js` only overwrites the built-in placeholder vehicles/testimonials/contact info/compliance badges if a backend is actually connected and returns data — so the template always looks finished, whether or not it's been set up yet.
- **Trust claims are opt-in, not fabricated.** Trustpilot/Google review links and FCA/BVRLA numbers (Admin → Site Settings) only render on the public site once an admin has actually entered them.

## Still needed from you and Dre & Ferrell (content, not code)

- [ ] Final brand name (site currently says "Sourced London" throughout — see `BRAND-GUIDE.md` for the rename steps)
- [ ] Real email, phone/WhatsApp number, and address — entered once the backend is connected, via **Admin → Site Settings** (no more editing JS files by hand)
- [ ] Real logo file, if/when designed (current wordmark costs nothing and needs no replacing until you have one)
- [ ] Real vehicle listings — add these in **Admin → Vehicles** (or bulk-import via the Supabase table editor)
- [ ] Real client testimonials — **Admin → Testimonials**, with each client's permission to publish
- [ ] "About Us" story — still a placeholder paragraph in `about.html`
- [ ] Real Trustpilot/Google review links and any FCA/BVRLA numbers, once actually held — **Admin → Site Settings → Trust & Compliance**

## Design decisions, briefly

- **Reference:** escalux.co.uk — dark, black/navy, sans-serif only, chauffeur-service tone.
- **Sourced London differentiation:** charcoal/ivory/brass palette (warmer, less severe), a high-contrast didone serif (Bodoni Moda) paired with Manrope for "quiet luxury," copy repositioned from "status transport" to "trustworthy sales & sourcing."
- **Marques strip** (Home + Vehicles) highlights Range Rover / Land Rover / Discovery / Ferrari / Rolls-Royce as direct trade relationships, distinct from the broader "also sourced" list — based on real competitor research into how UK prestige car-sourcing brokers signal capability without a full fleet of stock photos.
- **"Sell Your Car" is a second funnel**, not bolted onto Contact — same pattern seen across every competitor site researched.
- **No "Add" button** — removed per your note; vehicle actions are Enquire / Save / WhatsApp.
- **Make + Model as separate fields** on the enquiry form, pre-filled automatically from a vehicle's "Enquire" button.
- **Payments stay in Stripe test mode** until you're ready to go live under a finalized brand/business entity — flipping to real money is a key swap, not a rebuild.
- **Vehicle photos stay honest placeholders**, never AI-generated fakes — the site's own trust promise ("every vehicle inspected") would be undermined by fabricated inventory photos. Branding/hero imagery is a separate question from inventory photos.
