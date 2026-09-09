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

## Reminder for any option

This is a demo of the **template** — placeholder vehicles, placeholder testimonials, and the brand name/contact details are all TBC until real ones are provided (see `README.md`'s checklist). Worth saying that up front to a prospect so the placeholders read as "not filled in yet" rather than "the real content."
