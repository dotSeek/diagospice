# Diago Spice Resto Bar: website, menu and promotions audit

Audit date: 6 November 2026. Local site (`npm run dev`, http://localhost:3200) inspected in Chrome
(desktop 1440 x 900) and WebKit as iPhone 14 (the engine every iPhone browser uses).
Screenshots: `docs/screenshots/before/` (before changes) and `docs/screenshots/after/`.

## 1. Website structure (before)

| Area | Component | Notes |
|------|-----------|-------|
| Header | `layout/Header.tsx` | Menu circle, logo card, Reserve pill. Icon only buttons on phones. |
| Hero | `sections/HeroSection.tsx` | Name, buffet ribbon, photo with copy, chips, two CTAs, three info cards. |
| About | `sections/AboutSection.tsx` | Red block, drop cap text, three notes, photo. |
| Delivery menu | `sections/MenuSection.tsx` + `menu/*` | Static data in `src/data/menu.ts`, WhatsApp order card, PDF download and share. |
| Buffet | `menu/BuffetMenu.tsx` | Friday to Sunday, 2pm to 12am, adults £13.99, kids under 10 £6.99. |
| Gallery, Location, Contact, Footer | `sections/*`, `layout/Footer.tsx` | Unchanged by this work. |
| Staff area | `/staff/` (`staff/index.html`, `src/staff/*`, `server/staff.ts`) | Admin and staff sign in, encrypted A4 restaurant and bar PDFs. |
| 404 | `public/404.html` | Branded. |

Design tokens: `src/styles/theme.css` (night and gold palette, Playfair Display, Bitter, Great Vibes).
Motion: `src/components/motion/Reveal.tsx` (Framer Motion, reduced motion respected).

## 2. Source documents

| Document | Content | Used for |
|----------|---------|----------|
| `Diago Menue delivery.docx` | 71 dishes, 7 deals, buffet, delivery note | Website delivery menu, delivery PDF |
| `Diago Menue.docx` | Same dishes at dine in prices (78 priced lines), buffet | Restaurant QR menu, A4 staff PDF, leaflet |
| `Diago Bar  Menue.docx` | 67 priced lines, plus owner added soup and tins | Bar QR menu, A4 staff PDF |

Prices were checked line by line against the documents (see `diago-final-qa-report.md`).
Dine in prices are kept out of this public repository (`private/data/`, encrypted copies only).

## 3. Verified offers

**None of the documents contain any opening, first order, discount or bar offer.**
The only offer style wording is "Free delivery within 3 miles" (delivery document).
Delivery terms confirmed by the owner in chat: free within 3 miles, £2 beyond, minimum order £15 to £20.

## 4. Missing business information

See `diago-offer-content-register.md`, section "Confirmation checklist". In short: every offer value,
item, price, condition and date; general opening hours (only buffet hours are known).

## 5. UI defects found

| # | Defect | Status |
|---|--------|--------|
| 1 | Floating WhatsApp button overlaps content at the right edge on phones | Known, minor, unchanged |
| 2 | Hero "Weekend buffet" chip repeats the buffet ribbon above it | Known, left as chosen copy |
| 3 | Dev server shows the home page for unknown URLs (production shows the 404) | Dev only |
| 4 | Earlier: menu rows hidden on iPhone (edge on flip animation) | Fixed before this audit |

## 6. Changes made (summary)

Offer register and promotion components (hidden until published), QR table menus for restaurant
and bar, admin editor for prices and offers with draft, preview and publish, admin QR tools and
print files, hero Resto Bar line, A4 tri-fold promotional leaflet. Details in
`diago-website-implementation-report.md`.
