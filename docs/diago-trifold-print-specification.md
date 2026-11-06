# Diago Spice Resto Bar: A4 tri-fold promotional leaflet, print specification

Files (git ignored because they show dine in prices; build with `npm run leaflet`):

| File | Purpose |
|------|---------|
| `private/print/diago-spice-promo-leaflet.pdf` | Print file, 2 pages |
| `private/print/diago-spice-promo-leaflet.html` | Editable source (open in Chrome; text and layout are plain HTML and CSS) |
| `private/print/diago-spice-promo-leaflet-fold-proof.pdf` | Panel order and folding proof |
| `scripts/build-promo-leaflet.ts` | Generator (content, layout, QR codes, trim and bleed boxes) |

## Format

| Setting | Value |
|---------|-------|
| Flat size (trim) | A4 landscape, 297 x 210 mm |
| Page size with bleed | 303 x 216 mm (3 mm bleed on every edge) |
| PDF boxes | MediaBox = BleedBox = 303 x 216 mm, TrimBox = 297 x 210 mm inset 3 mm |
| Fold | Roll fold (letter fold), finished about 99 x 210 mm (DL) |
| Panel widths | 97 / 100 / 100 mm (narrow panel folds in) |
| Sides | Double sided, full colour, flip on the short edge |
| Safe area | Content 5 mm inside every trim edge and fold |
| Colour | Built in RGB by Chrome. Ask the printer to convert to CMYK (or supply their profile) |
| Images | Photos 1200 px across about 97 to 103 mm, about 300 dpi at print size |

Confirm the printer's exact roll fold panel widths before ordering; adjust `.p-a/.p-b/.p-c` in the script.

## Panel order (fold order, not reading order)

| Side | Left (97 or 100 mm) | Middle (100 mm) | Right |
|------|---------------------|-----------------|-------|
| Side 1, outside | P5 Delivery and bar (folds in, 97 mm) | P6 Back cover | P1 Front cover (100 mm) |
| Side 2, inside | P2 Introduction (100 mm) | P3 Dine in (100 mm) | P4 Signature dishes (97 mm, folds in first) |

Folding: lay side 2 face up, fold P4 in over P3, then fold P2 and P3 over it so P1 is on top.

## Content and sources

| Panel | Content | Source |
|-------|---------|--------|
| P1 Cover | Logo, Resto Bar, Grand Opening, brand line, weekend buffet (or the first live dine in offer) | Website, menu documents, live offers |
| P2 Introduction | Hero and About copy, photos, address, phone | Website copy |
| P3 Dine in | Live restaurant offers (none yet), dine in meal deals, weekend buffet, separation note | Restaurant menu, live offers |
| P4 Signature dishes | 10 dishes at dine in prices, QR to the restaurant QR menu | Restaurant menu |
| P5 Delivery and bar | Delivery terms and WhatsApp QR, live delivery offer (none yet); bar introduction, bar QR, live bar offer (none yet) | Owner, bar menu |
| P6 Back cover | Address, buffet hours, phone, website, Facebook, website and WhatsApp QR codes, brand line | Website |

General opening hours are not printed (not confirmed). Offers print only when live; regenerate the
leaflet after publishing offers (`npm run leaflet`, reads the live site by default; set
`LEAFLET_SOURCE=http://localhost:3200` to use local data).

## QR codes (all tested by decoding the rendered pages)

| QR | Destination |
|----|-------------|
| Restaurant menu | https://diagospice.co.uk/restaurant-menu/ |
| Bar menu | https://diagospice.co.uk/bar-menu/ |
| Order on WhatsApp | https://wa.me/447901024843?text=Hi%20Diago%20Spice%2C%20I%20would%20like%20to%20place%20an%20order. |
| Website | https://diagospice.co.uk |
