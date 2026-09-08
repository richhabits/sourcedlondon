# Cleardrive — Activation Guide ("out of the box" setup)

This template ships with no backend of its own. Whoever runs a copy of it connects their **own** free accounts from inside the admin panel — nothing here is tied to the person who built or sold the template. Total time: ~15 minutes, £0 to start (test mode).

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

Add a second admin (e.g. Dre) the same way once they've created their own account.

## 4. Turn on payments (Stripe, test mode — no business verification needed)

1. Create a free account at [stripe.com](https://stripe.com). Stay on the **Test mode** toggle (top-right of the dashboard).
2. Go to **Developers → API keys** → copy the **Secret key** (starts `sk_test_...`).
3. Install the Supabase CLI once: `npm install -g supabase`
4. From this project folder:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref   # found in your Supabase project URL
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase functions deploy stripe-checkout --no-verify-jwt
   ```
5. Done. Customers can now click "Reserve (test deposit)" in their account dashboard and get a real Stripe Checkout page — using Stripe's test card `4242 4242 4242 4242`, any future date, any CVC. No real money moves until you swap in live (`sk_live_...`) keys, which does require Stripe business verification.

## 5. Turn on the AI assistant (free tier, no card required)

1. Get a free API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) (Google account, no billing needed for the free tier).
2. From this project folder:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-key-here
   supabase functions deploy ai-proxy --no-verify-jwt
   ```
3. Reload the site — a chat bubble appears for customers, and "✦ Draft with AI" buttons light up in the admin panel (vehicle descriptions, enquiry replies).

## 6. Check everything's live

Open `admin.html` → **Services** tab. It pings both Edge Functions and shows Connected / Not configured for Database, Payments, and AI in real time.

## What's genuinely free at small scale, and what isn't

| Service | Free tier covers | Starts costing when |
|---|---|---|
| Supabase | Database, Auth, 2 Edge Functions, this whole app | Real scale (thousands of users) or a 2nd project in the same org |
| Vercel / Netlify | Hosting a static site | Real scale / custom team features |
| Stripe | Unlimited test mode | Never a monthly fee — live mode takes a per-transaction % only, once verified |
| Google Gemini | Generous free-tier request limits | High-volume production use |

## Re-selling this template to another client

Nothing above is specific to one business. For a new client:
1. Copy this whole folder.
2. Update `BRAND-GUIDE.md` naming and `assets/js/main.js`'s fallback config for their brand.
3. Have them run Steps 2–5 above with their own accounts — their data, their keys, their cost (which is £0 to start).
