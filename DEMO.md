# Sharing This as a Demo

Three ways to let someone preview the site, from easiest-to-send to most hands-on — plus one way to justify what it's worth.

## Justifying the price: the Provenance Report

A separate, published page walks through everything built, how it was verified (real Lighthouse scores, real bugs found and fixed), and what comparable work costs UK agencies — sourced and linked, not just asserted. Use this alongside the live link when the conversation turns to price, not instead of it. It's a private link until shared from its own share menu.

## Option 1: Live link (recommended for pitching)

This is the one to use when you're messaging a prospect — no download, no terminal, just a link. **Already set up and live** — nothing to do here, just send it:

**[sourcedlondon.vercel.app](https://sourcedlondon.vercel.app)**

Every `git push` to the repo auto-deploys to this same URL within about a minute — no re-setup, ever.

**WhatsApp messages ready to copy:**

> 👀 Take a look — this is the new site: [your-link-here]
> Have a click around, especially the Vehicles and Sell Your Car pages. Let me know what you think 🚗

> Quick preview of what I've built 🔥
> [your-link-here]
> Works exactly the same on your phone as it will live — try the enquiry form, it actually works (goes to WhatsApp/email).

> Here's the demo we spoke about: [your-link-here]
> Everything you see is real and working — nothing's a mockup. Admin panel's separate, happy to walk you through that on a call.

## Option 2: Zero-terminal local preview

For when you're sat with someone in person, or sending a ZIP instead of a link:

1. Download the repo as a ZIP from GitHub (green "Code" button → Download ZIP), or send them the `website/` folder directly.
2. Unzip it.
3. Double-click `website/index.html` — opens in their default browser.

Identical steps on Mac and Windows. No install, no terminal.

## Option 3: Local server via terminal

Only worth it if you specifically want it running on `localhost` rather than opened as a file (e.g. to avoid minor `file://` quirks in some browsers).

**Mac** (Python ships with macOS — no install needed):
```bash
cd website
python3 -m http.server 8000
```
Open `http://localhost:8000`

**Windows** (if Python's installed):
```bash
cd website
python -m http.server 8000
```
Or with just Node installed, no Python needed:
```bash
npx serve website
```

## Showing the admin panel & giving real logins

There's no pre-made "demo login" for `admin.html` or `account.html`, and that's by design, not an oversight: the whole architecture is that **whoever runs the site owns their own backend** — nobody's API keys or accounts are baked in (see README.md, "Architecture, briefly"). A fake demo login would either be a real account tied to someone else's project, or fake data that misrepresents how it works. Neither is worth doing.

**The better move: set it up live, in front of them.** This turns the "gap" into the strongest part of the pitch — it proves the setup is genuinely as simple as claimed, and they walk away with *their own* real admin and customer logins, not a demo you control.

**Script for the call (~15 minutes, follow `SETUP.md` steps 1-3):**
1. "Let's connect your database live — this is the only setup step, and it's yours forever, not mine." Create a free Supabase project together (or have them do it, so it's in their name from the start).
2. Paste the schema into their SQL Editor, run it. "That's your entire database — vehicles, customers, messages, all of it."
3. Paste their Project URL + anon key into the Setup screen on `admin.html`. "Watch — connected." (It tests the connection live and tells you immediately if something's wrong — see README's architecture notes.)
4. Have them sign up for a real account on `account.html` right there — that's their real customer-side login.
5. Run the one SQL line from `SETUP.md` step 3 to make that account an admin. Sign in on `admin.html` with the same email/password — that's their real admin login, created in the room, in front of them.

If you'd rather have something ready to *show* without doing this live (e.g. a cold outreach message, not a call), set up a throwaway Supabase project yourself first using a **separate free Google/Supabase account** (not your main paid org — a fresh signup gets its own free project slots, no cost). Populate it with a couple of vehicles and one test account so you have real screenshots or a real login to reference — just don't hand over *that* login as if it were theirs; it's a rehearsal copy, not their real one.

## Reminder for any option

This is a demo of the **template** — placeholder vehicles, placeholder testimonials, and the brand name/contact details are all TBC until real ones are provided (see `README.md`'s checklist). Worth saying that up front to a prospect so the placeholders read as "not filled in yet" rather than "the real content."
