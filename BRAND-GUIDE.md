# Sourced London — Brand Guide (working draft)

Working name: **Sourced London**. Everything here is built to be renamed in ~10 minutes once you confirm the real brand name — see "How to rename" at the bottom.

## Logo

The site currently ships with a **text wordmark** ("SOURCED LONDON" set in Fraunces, a quiet-luxury serif) plus a small diamond/chevron mark — no paid logo generation was used, so there's nothing to swap out or pay for later.

**Do:**
- Keep generous clear space around the logo (at least the height of the mark on all sides).
- Use it only on dark backgrounds (`#0B0B0D` / `#111114`) or a matching light-on-dark surface.
- Keep the wordmark in one weight/tracking — don't bold or condense it per-page.

**Don't:**
- Don't stretch, rotate, drop-shadow, outline, or recolor the mark per-page.
- Don't pair it with a second display font anywhere on the site.
- Don't place it over busy photography without a dark scrim behind it.

When you have a real logo file, drop it at `website/assets/img/logo.svg` and replace the inline SVG diamond + `<span class="logo-word">` in each page's header with an `<img>` tag pointing at it — one find/replace across the 5 HTML files.

## Typography

- **Display / headings:** [Bodoni Moda](https://fonts.google.com/specimen/Bodoni+Moda) — a high-contrast didone serif, the same family of typeface fashion and luxury houses use (Vogue-adjacent). Loaded free from Google Fonts, no license cost.
- **Body / UI:** [Manrope](https://fonts.google.com/specimen/Manrope) — a clean geometric sans-serif for body copy and UI.

This pairing was chosen deliberately to differentiate from escalux.co.uk, which uses a plain sans-serif throughout with no serif display type — the dramatic high-contrast headline is doing a lot of the "expensive" feeling here. (Earlier draft used Fraunces/Inter — replaced after review for a bolder, more editorial luxury feel.)

## Color Palette

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0B0B0D` | Page background |
| `--surface` | `#17171B` | Cards, panels |
| `--ivory` | `#F4EFE6` | Primary text |
| `--gold` | `#B99A5B` | Accent, links, borders |
| `--gold-bright` | `#D9BD82` | Hover states |

Deliberately closer to charcoal/ivory/brass than Escalux's black/navy — softer and warmer, so it reads as "sales trust" rather than "chauffeur exclusivity."

## Photography — Do's and Don'ts

No real vehicle photography exists yet, so every image slot on the site is a clearly-labelled placeholder ("Vehicle photo to be added"). When real photos are ready:

**Do:**
- Shoot at golden hour or in even overcast light — avoid harsh midday shadows on paintwork.
- Get one 3/4-front exterior shot, one interior/dash shot, and one detail shot (badge, wheel, or stitching) per car — consistency across listings matters more than any single "hero" shot.
- Shoot every car against a similar type of backdrop (e.g. always outdoors, always at the same general time of day) so the fleet page feels curated, not scraped from a listings site.
- For testimonial photos, use the client's actual car if you have permission — never a stock photo standing in for a real client's vehicle.

**Don't:**
- Don't mix phone snapshots with professional shots on the same page — pick one standard and hold it for every car.
- Don't use manufacturer press photos for cars you're actually selling — buyers expect to see the real unit.
- Don't publish a client's name, photo, or comment on the Reviews page without their explicit permission first.

## Voice

Sophisticated, direct, low-pressure. Short sentences. No exclamation marks, no "amazing deals," no countdown urgency. The copy currently on the site (`website/*.html`) is written in this voice — keep new copy consistent with it rather than reverting to generic dealership language.

## How to rename once the brand name is confirmed

1. Find/replace `Sourced London` → new name across `website/*.html` and `README.md`.
2. Update `<title>` and `<meta name="description">` tags in each page's `<head>`.
3. Update `brandName` in `website/assets/js/main.js`.
4. If the new name changes the "quiet luxury" fit of Fraunces/gold, re-run this brief through the `ui-ux-pro-max` or `design` skill with the new name for a fresh palette/type check before committing to it site-wide.
