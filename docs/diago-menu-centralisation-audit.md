# Diago Spice: centralised menu audit and migration plan

Date: 6 November 2026. Stage 1 of the centralised menu work: audit and plan only.
No storage, code or live data has been changed. Nothing is committed, pushed or deployed.

Files with this report:
- `docs/menu-migration-mapping.csv`: one row per item, with its proposed permanent ID, category, prices on each menu and status.
- `docs/screenshots/menu-audit-before/`: labelled screenshots taken before any change (iPhone 14, WebKit, plus the admin).

## 1. Current architecture

| Part | Today |
|------|-------|
| Storage | One document per menu: delivery, restaurant, bar, buffet. Each has a draft and a published copy. Redis keys `diago:menu:{venue}:{draft\|published}`. |
| Local development | JSON files in `private/store/`. |
| Live site (Vercel) | **Read only.** Upstash Redis is not connected, so the live site serves the built in menus (`src/data/menu.ts` and `private/encrypted/*.json.enc`). No admin data exists in production yet. |
| Unsaved changes | The editor shows a warning and disables Save draft when storage is read only. A failed save shows the server's error (HTTP 503). No silent loss. |
| Items | Every menu holds its own full copy of every section and item (name, note, price). Items are linked only by matching names. |
| Offers | Each offer belongs to one menu (`venue`) and lists items by name with a regular price and an offer price. Checked by `offerProblems` before going live. |
| Buffet | Its own document with days, hours, adult and kids prices, sections of dish names and its own offers. Dish names are picked from the restaurant menu. |
| Customer pages | Website delivery menu (`/`), restaurant QR (`/restaurant-menu/`), bar QR (`/bar-menu/`), offers poster QR (`/offers/`). All read `/api/menu` and `/api/offers`. |
| Printed files | Delivery tri-fold, A4 staff menus, leaflet and QR cards are built from the built in data by scripts. They do not read the admin data. |

Vercel project settings could not be listed from this computer because the project is not linked to the Vercel CLI here. That does not affect the plan. Connecting Upstash is a step you take in the Vercel dashboard.

### Admin UI today
- Tabs per menu (Delivery, Restaurant, Bar, Buffet Special Menu).
- Each tab: offers, then the full item list with price, Edit and Remove (screenshot 07).
- Adding a dish to all three menus means adding it three times. Renaming it on one menu does not rename it on the others.
- No show or hide switch: removing an item from a menu loses its price.
- Buffet dishes are picked from the restaurant menu only, so bar only dishes show as "not on the restaurant menu" (screenshot 08).

## 2. Data audit

| | Items | Sections |
|---|---|---|
| Delivery | 78 | 10 |
| Restaurant | 78 | 10, same as delivery |
| Bar | 72 | 10, with its own names and order |
| Buffet | 37 dishes | 6 buffet sections |
| **Distinct items** | **84 on the menus, plus 4 buffet only names** | |

- Delivery and restaurant share all 78 items. 64 have different prices.
- Restaurant and bar share 66 items. 24 have different prices.
- Bar section ids carry a `bar-` prefix (`bar-mains`) for the same sections as the other menus, and some have their own names: "Mains with rice or nan", "Burgers with chips". Bar only sections: "Soup", "Soft drinks".
- Bar only items: Soup (Veg), Soup (Non Veg), Chicken Tikka, Coca Cola, Fanta, Pepsi.
- Not on the bar: Egg Roast, Chicken Tikka Masala, Steam Rice, Pilaw Rice, Garlic Rice and all 7 deals.
- No images, dietary or allergen details exist anywhere in the data today.

## 3. Proposed data model

Every relationship uses a permanent ID, never a name.

**Master catalogue** (one document, draft and published)
- Categories: `id`, name, type (food, drink, deal).
- Items: `id` (for example `item-butter-chicken`, never changes even if renamed), name, description, type, deal contents, image (optional), dietary and allergen details (optional, only when verified), status (active or archived).

**Each menu: delivery, restaurant, bar** (one document each, draft and published, as today)
- Sections: category id, this menu's display name (so the bar keeps "Mains with rice or nan"), order. A menu can also have its own sections (bar "Soft drinks").
- Entries: item id, section, **this menu's price**, visible (on or off, price kept when off), order, offer eligible.
- Offers: as today, scoped to this menu, but items referenced by item id.

**Buffet** (as today, upgraded)
- Sections with ordered item ids, adult and kids prices, buffet offers. Being in the buffet never gives an item a price.

**What customers get:** the server combines the published catalogue with each published menu and sends exactly the same shape the website, QR menus and offers page read today. Customer pages, URLs and printed QR codes do not change.

**Publishing:** menus and the buffet publish on their own, as today. A catalogue change (for example renaming an item) shows which menus it affects before publishing.

## 4. Migration plan

1. **Backup:** the migration script first writes a full copy of every current document (all menus, drafts and published) to a dated backup file, and in Redis under `diago:backup:{date}:…`.
2. **Dry run (default):** builds the new catalogue and menus in memory and prints a report: every item, its ID, prices per menu, sections and offers, plus a before and after comparison of what customers would see. It must show zero differences before anything is written.
3. **Apply (only with approval):** writes the new documents under new keys (`diago:v2:…`). The old `diago:menu:…` documents are **not** touched or deleted.
4. **Switch:** the server reads the new model only when a setting is turned on (`MENU_MODEL=v2`). Rollback is turning it off: the old documents are still there.
5. **Repeatable and safe:** running it again skips any menu that already has newer admin changes in the new model, unless told otherwise.
6. **Clean up:** the old documents are removed only after you have checked the migrated menus, as a separate approved step.

Stages, each needing your approval: local build and tests, then local migration, then production configuration (Upstash), then production migration, then deploy.

## 5. Matches that need your confirmation

66 items match on name, section and description on every menu they appear on, and are proposed as one shared item each (status `match` in the CSV). These need a decision:

| # | Question | Items | My suggestion |
|---|----------|-------|---------------|
| A | The bar's "Mains with rice or nan": are these the same dishes as the delivery and restaurant curries (rice or nan included on the bar), or different products? Bar prices are mostly the delivery price, £1 above the restaurant price. | Chicken Roast, Mutton Korma, Chicken Korma, Butter Chicken, Chicken Madras, Chicken Vindaloo, Thai Red, Thai Green, Panang Curry, Diago Special Beef Stew, Beef Korma, Beef Roast, Chicken Piccata, Paneer Curry | Same item. The bar section name keeps saying "with rice or nan", as today. |
| B | The bar's "Burgers with chips": same burgers as on the other menus? Prices are mostly the same as delivery. | Beef, Chicken, Doner, Chicken Fillet, Garlic Parmesan Dipped Cheese Burger | Same item, section name keeps "with chips". |
| C | Mixed Loaded Fries says "Chicken and doner" on delivery and restaurant, "Doner and chicken" on the bar. | Mixed Loaded Fries | Same item, one description: "Chicken and doner". |
| D | Chicken Tikka (bar only, £7.99) and Chicken Tikka Masala (delivery and restaurant). | Chicken Tikka | Keep as two different items. |
| E | Buffet dish "Chips". | Chips | Link to Plain Chips. |
| F | Buffet dishes not on any menu. | Aloo Keema, Daal Makhni, Cauliflower 65 | Create them as catalogue items on the buffet only, with no price. |
| G | Images, dietary and allergen details. | All | Fields added but left empty until the owner confirms them. Nothing is guessed. |

## 6. Admin screens to build after approval

- **Master items:** search, category and food or drink filters, Add new item, Edit in a side drawer (name, description, category, image, dietary and allergens, a switch and price per menu, shown only for the menus it is on), bulk select to add to or remove from a menu, draft and published badges.
- **Menu tabs (Delivery, Restaurant, Bar):** the menu's sections with its own names, items with on or off switch, price and drag to reorder, offers as today.
- **Buffet builder:** browse and multi select from the whole catalogue, sections, reorder, preview, publish, adult and kids prices and buffet offers.

## 7. Tests planned

Before and after comparison of every menu's items, prices, sections and offers (must match). Master item create and edit, independent prices, show and hide, section names, bulk assignment, buffet selection and pricing, offers, QR destinations, iPhone layouts in WebKit, saving with storage connected and with it missing, migration dry run, apply, repeat run and rollback.
