# Sourced London — Activation Guide ("out of the box" setup)

This template ships with no backend of its own. Whoever runs a copy of it connects their **own** free accounts from inside the admin panel — nothing here is tied to the person who built or sold the template. Total time: ~15 minutes, £0 to start (test mode).

Note: the three `supabase functions deploy` commands below deploy with JWT verification **on** (the default) — every request the site makes already carries a valid token (either the public anon key or a signed-in user's session), so this is free hardening with no functional cost. Don't add `--no-verify-jwt` unless you have a specific reason to.

## 1. Get the site online (optional if you're just testing locally)

You can preview everything by opening `website/index.html` directly in a browser — no server needed. To actually go live:

1. Push this folder to a GitHub repo.
2. Connect the repo to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (both free for a static site) — set the site's root/output directory to `website/`.
3. Deploy. You now have a live URL.

## 2. Connect the database (required — powers the admin panel, vehicles, accounts)

1. Create a free project at [supabase.com](https://supabase.com) → New Project.
2. Open **SQL Editor** in that project → paste the entire contents of `supabase/schema.sql` from this folder → **Run**.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
4. Open `admin.html` on your site (or locally) → paste those two values into the Setup screen → **Save & Connect**.

That's it — the database is live and the admin panel can now log in.

## 3. Make yourself an admin

1. Go to `account.html` on your site and create an account (this is the *customer-facing* signup — you're using it once to create your own login).
2. Back in Supabase's SQL Editor, run:
   ```sql
   insert into admin_users (id) select id from auth.users where email = 'you@example.com';
   ```
3. Now sign in at `admin.html` with that same email/password — you have full admin access: Vehicles, Testimonials, Enquiries, Reservations, Site Settings.

Add a second admin (e.g. Ferrell) the same way once they've created their own account.

## 4. Turn on payments (Stripe, test mode — no business verification needed)

1. Create a free account at [stripe.com](https://stripe.com). Stay on the **Test mode** toggle (top-right of the dashboard).
2. Go to **Developers → API keys** → copy the **Secret key** (starts `sk_test_...`).
3. Install the Supabase CLI once: `npm install -g supabase`
4. From this project folder:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref   # found in your Supabase project URL
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase functions deploy stripe-checkout
   ```
5. Done. Customers can now click "Reserve (test deposit)" in their account dashboard and get a real Stripe Checkout page — using Stripe's test card `4242 4242 4242 4242`, any future date, any CVC. No real money moves until you swap in live (`sk_live_...`) keys, which does require Stripe business verification.

## 5. Turn on the AI assistant (free tier, no card required — and it self-rotates across providers)

The `ai-proxy` function accepts up to three free-tier keys. Set **any one** and it works; set more than one and it randomly spreads requests across whichever are configured, automatically retrying a different provider if one errors or is rate-limited — so you get more free runway before anything could ever cost money, and no single provider's limit takes the assistant down.

1. Pick one or more:
   - **Gemini** (recommended first pick): [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — Google account, no card.
   - **Groq**: [console.groq.com/keys](https://console.groq.com/keys) — very fast free-tier Llama models, no card.
   - **OpenRouter**: [openrouter.ai/keys](https://openrouter.ai/keys) — uses their `:free` model tier, no card.
2. From this project folder, set whichever you got:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-key-here
   supabase secrets set GROQ_API_KEY=your-key-here
   supabase secrets set OPENROUTER_API_KEY=your-key-here
   supabase functions deploy ai-proxy
   ```
3. Reload the site — a chat bubble appears for customers, and "✦ Draft with AI" buttons light up in the admin panel (vehicle descriptions, enquiry replies).

## 6. Turn on the number-plate / MOT checker (free UK government APIs)

Used on `sell.html` (part-exchange leads) and in Admin → Vehicles ("Look Up Reg"). Set either or both:

- **DVLA Vehicle Enquiry Service** (tax status, colour, fuel type, basic MOT status): register free at [register-for-vehicle-enquiry-service.dvla.gov.uk](https://register-for-vehicle-enquiry-service.dvla.gov.uk)
  ```bash
  supabase secrets set DVLA_API_KEY=your-key-here
  ```
- **DVSA MOT History API** (full test history, advisories, mileage): register free at [documentation.history.mot.api.gov.uk](https://documentation.history.mot.api.gov.uk) — this one issues an Azure AD client ID/secret plus an API key; their signup flow walks you through it.
  ```bash
  supabase secrets set DVSA_MOT_CLIENT_ID=your-client-id
  supabase secrets set DVSA_MOT_CLIENT_SECRET=your-client-secret
  supabase secrets set DVSA_MOT_API_KEY=your-api-key
  ```
Then deploy:
```bash
supabase functions deploy vehicle-lookup
```

## 7. Check everything's live

Open `admin.html` → **Services** tab. It pings all three Edge Functions and shows Connected / Not configured for Database, Payments, AI, and Reg Lookup in real time.

## What's genuinely free at small scale, and what isn't

| Service | Free tier covers | Starts costing when |
|---|---|---|
| Supabase | Database, Auth, 3 Edge Functions, this whole app | Real scale (thousands of users) or a 2nd project in the same org |
| Vercel / Netlify | Hosting a static site | Real scale / custom team features |
| Stripe | Unlimited test mode | Never a monthly fee — live mode takes a per-transaction % only, once verified |
| Gemini / Groq / OpenRouter | Generous free-tier request limits each, and the assistant rotates across whichever you set | High-volume production use across all configured providers at once |
| DVLA VES / DVSA MOT History | Free, government-run, no card | Not a paid product — these don't have a paid tier to fall into |

## Other things worth knowing

- **"Sell Your Car" leads** land in the same Admin → Enquiries table as buyer enquiries, tagged **Selling** vs **Buying** — no separate inbox to check.
- **In-house messaging** (Admin → Messages, and the Messages panel in a customer's own account) lets you and a signed-in customer talk without leaving the site — no email/WhatsApp round-trip required for quick back-and-forth.
- **Customer-saved links**: signed-in customers can paste a link + note about a car they've seen elsewhere (Autotrader, etc.) from their account page — visible to admins under Enquiries → "Vehicles Customers Are Watching Elsewhere," useful sourcing context.
- **Trust & Compliance fields** (Admin → Site Settings) for a Trustpilot URL, Google Reviews URL, FCA number, and BVRLA number each only appear on the public Reviews page once you've actually filled them in — never shown as an unverified claim.

## Re-selling this template to another client

Nothing above is specific to one business. For a new client:
1. Copy this whole folder.
2. Update `BRAND-GUIDE.md` naming and `assets/js/main.js`'s fallback config for their brand.
3. Have them run Steps 2–5 above with their own accounts — their data, their keys, their cost (which is £0 to start).
