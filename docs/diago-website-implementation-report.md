# Diago Spice Resto Bar: implementation report

Date: 6 November 2026. Not committed, pushed or deployed (awaiting approval).

## What was built

### 1. Content model and storage
- `src/data/content.ts`: typed menu document per venue (delivery, restaurant, bar) holding its own
  categories, buffet and offers; offer rules (`offerProblems`, `liveOffers`, `docProblems`); badge labels
  (Delivery only, Opening Special, Bar Opening Special). No runtime imports, so the site, API and scripts share it.
- `server/content.ts`: draft and published documents per venue.
  Storage: Upstash Redis (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, or Vercel's
  `KV_REST_API_URL` + `KV_REST_API_TOKEN`); local JSON in `private/store/` during development;
  otherwise read only, serving the built in menus.

### 2. API
| Route | Access | Purpose |
|-------|--------|---------|
| `GET /api/menu?name=delivery\|restaurant\|bar` | Public | Published menu with live offers only (source removed). Cached 30 to 60 s. |
| `GET /api/menu?name=...&draft=1` | Admin | Draft preview |
| `GET /api/offers` | Public | Live offers per venue for the website |
| `GET/PUT /api/staff/content?venue=` | Admin | Load or save a draft (validated) |
| `POST /api/staff/publish?venue=` | Admin | Draft becomes published (validated again) |
| `POST /api/staff/discard?venue=` | Admin | Delete the draft |

Admin routes need the signed admin cookie, same origin and JSON. The staff role cannot edit.

### 3. Customer facing
- **QR table menus** `/restaurant-menu/` and `/bar-menu/` (`src/table/*`): no sign in, hidden from search,
  not linked from the public site. Show the venue's Grand Opening Special Offers (regular and offer price,
  conditions) and highlight discounted rows with the venue badge. "Please order with our staff / at the bar".
- **Offers page** `/offers/` (`src/table/OffersHub.tsx`): the one page behind the entrance poster's QR
  code. Live restaurant offers and live bar offers in separate sections, each linking to its own menu.
  With no live offers it says so and points to the menus, never showing old prices. Hidden from search.
- **Website**: Grand Opening Specials (after the hero) and Grand Opening Food Offers (after About)
  render only when an offer is live (`src/components/offers/*`). The delivery menu reads the published
  delivery menu and highlights live delivery offer items, falling back to the built in menu.
- **Hero**: "Resto Bar" line under the name, "Delivery menu" button, and a dine in line
  ("Scan the QR code on your table for our restaurant and bar menus").

### 4. Admin dashboard (`/staff/`, admin only)
- **Menus and offers** editor (`src/staff/ContentEditor.tsx`): tabs for Delivery, Restaurant, Bar;
  menu items per section (change a price, add a new dish, drink or deal, edit its name and note, remove it;
  renaming or removing an item keeps offers in step; the server refuses duplicate names, names over
  60 characters, `<` or `>`, and deals with nothing listed); weekend buffet details; offers with on/off, title, offer, description, discounted items with
  live regular price, conditions, optional start and end dates, source; live "why hidden" checks;
  Save draft, Preview draft, Publish, Discard draft.
- **Table QR codes** (`src/staff/qrAdmin.ts`): previews, Download print PDF (A6 card + A4 poster),
  PNG, SVG, quick Print table card, Open menu. Codes always point at the live site.
- **Entrance offers poster** (`renderPosterAdmin` in `src/staff/qrAdmin.ts`): preview, Download A4 PDF,
  print shop PDF (3 mm bleed), PNG (300 DPI), a live check of what the QR code shows today (offers live per
  menu, or the regular menu), Open menu buttons, and "Manage restaurant/bar offers" which opens that tab
  in the editor. It checks again after each publish.

### 5. Print files
- `public/qr/diago-spice-{restaurant,bar}-menu-qr.{pdf,png,svg}` (`npm run qr`).
- A4 tri-fold promotional leaflet (`npm run leaflet`), see `diago-trifold-print-specification.md`.
- **A4 entrance offers poster** (`npm run poster`, `scripts/build-entrance-poster.ts`) into `public/poster/`:
  - Content: logo, "Diago Spice Resto Bar", "Special offers await!", "Your next favourite flavour is
    just a scan away!", then one panel: "Our offers", "Crave the Spice. Love the Taste!", ONE QR code for
    `https://diagospice.co.uk/offers/` (60 mm, error correction Q, plain white card, solid panel behind it),
    a gold "Scan, Discover, Savour" button and the short address, then the footer lines.
    No dishes, prices, dates, venue names or opening messages, so it is reusable all year.
  - Style: the same gold frame, red diamonds, rope divider and "wanted poster" panel as the menus, the
    dining photo behind the headline, and the website's leaf wallpaper (`--texture-wallpaper`) drawn as
    an inline SVG pattern so it stays vector in every viewer.
  - Files: `diago-spice-offers-poster.pdf` (A4 210 x 297 mm), `-bleed.pdf` (216 x 303 mm, TrimBox and
    BleedBox set, all text and the QR at least 12 mm inside the trim), `.png` (2480 x 3508 px, 300 DPI),
    `-preview.jpg` for the admin page. Fonts embedded as TrueType (static Playfair Display and Bitter from
    `@fontsource`, Great Vibes), no Type 3 fonts.
  - Colour: RGB. Ghostscript is not installed here, so no CMYK conversion was made; most print shops
    convert on output. Ask the printer for a proof if colour must be exact.
  - Tested: the QR decodes from the Chrome PDF, Apple's renderer (Quick Look, as on iPhone and WhatsApp)
    and the PNG, also with simulated glare, blur, a tilted view, low light and a 800 px phone capture.
- Delivery tri-fold and A4 staff menus unchanged.

## Connecting Upstash Redis (needed before admins can save on the live site)
1. Vercel > diagospice > Storage (or Marketplace) > Upstash for Redis > Create, free plan, region London.
2. Connect it to the diagospice project (Production and Preview). Vercel adds the REST URL and token.
3. Redeploy. The editor status line no longer says "Storage is not connected".
4. For local development against the same database, copy the two values into `.env`.

Until then the live site keeps serving today's menus and shows no offers.

## Limits and notes
- PDFs (delivery tri-fold, A4 staff menus, leaflet, QR cards) do not update automatically; regenerate on request.
- The website delivery share page (`/menu/`) and PDF use the built in delivery menu until regenerated.
- "First order" cannot be verified automatically (ordering is by WhatsApp or phone); the conditions text must say how staff check it.
- No unit test or lint setup exists in the project; checks were TypeScript, production build and browser tests.
