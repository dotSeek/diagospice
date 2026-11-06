# Diago Spice Resto Bar: final QA report

Date: 6 November 2026, local server (`npm run dev`). Engines: Chrome (desktop) and WebKit
(iPhone 14, iPhone 14 landscape, iPhone SE, iPad Mini). Screenshots in `docs/screenshots/after/`.

| # | Check | Result |
|---|-------|--------|
| 1 | TypeScript (`tsc --noEmit`) | Pass |
| 2 | Production build (`npm run build`), outputs include `/restaurant-menu/`, `/bar-menu/`, `/staff/`, `/qr/` | Pass |
| 3 | Unit tests and lint | None configured in the project |
| 4 | Restaurant QR menu: 71 dishes + 7 deals + buffet, dine in prices from `Diago Menue.docx` | Pass |
| 5 | Bar QR menu: 72 items (67 from the document + 2 soups + 3 tins), no buffet | Pass |
| 6 | Website delivery menu: 71 dishes + 7 deals, unchanged | Pass |
| 7 | WebKit, 4 devices x 3 pages: nothing hidden after scroll, no sideways scroll, no JS errors | Pass (12/12) |
| 8 | No offer shown anywhere while all offers are pending | Pass |
| 9 | Save rejected: offer price above menu price / restaurant offer moved to bar / active offer still pending | Pass (422 each) |
| 10 | Draft not public before publish; draft preview refused without admin sign in (401) | Pass |
| 11 | After publish: offer on restaurant API, QR restaurant page (section + highlighted row) and website sections only | Pass |
| 12 | Separation: bar menu 0 offers, delivery 0 offers while a restaurant offer was live | Pass |
| 13 | Offer source hidden from the public API | Pass |
| 14 | Admin sees Menus and offers + Table QR codes; staff account sees neither | Pass |
| 15 | QR downloads (PNG, SVG) decode to https://diagospice.co.uk/restaurant-menu/ and /bar-menu/ | Pass |
| 16 | QR print PDFs: A6 105 x 148 mm + A4 210 x 297 mm, both pages decode in Apple's renderer | Pass (4/4) |
| 17 | Leaflet: 2 pages 303 x 216 mm, TrimBox 297 x 210 mm, BleedBox 303 x 216 mm | Pass |
| 18 | Leaflet QR codes decode: website, bar menu, WhatsApp order (outside); restaurant menu (inside) | Pass |
| 19 | Leaflet panels: no overflow, no wrapped dish names, panel order matches the fold proof | Pass |
| 20 | Test data removed after testing (local store deleted, APIs back to built in menus) | Pass |

## Not yet tested
- On real phones scanning printed QR codes (please scan the printed cards before a full print run).
- Saving on the live site (needs Upstash connected, see the implementation report).
- Bar and delivery offer publishing were covered by the shared rules and the separation checks above,
  not by a separate end to end run each.
