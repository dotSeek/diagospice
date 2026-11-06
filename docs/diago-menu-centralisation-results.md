# Diago Spice: centralised menu, stage 1 results

Date: 6 November 2026. Stage 1 (local build and tests) is complete.
Nothing is committed, pushed or deployed. Your local menu data (`private/store/`) was not migrated: every
write test ran on a copy. The plan and approved answers are in `diago-menu-centralisation-audit.md`.

## What was built

| Part | Where |
|------|-------|
| Data model: master catalogue (permanent item ids, description, food, drink or deal, image, dietary, allergens, active or archived), per menu config (sections with own names and order, entries with own price, on or off, order, offer eligible), buffet with item ids | `src/data/catalogue.ts` |
| Customer view built from catalogue plus menu, same shape as today, so pages, URLs and QR codes do not change | `renderMenu`, `renderBuffet` in `src/data/catalogue.ts` |
| Server: new model behind `MENU_MODEL=v2`, new storage keys `diago:v2:…`, separate draft and publish for master items and each menu, checks on save and publish | `server/content.ts` |
| Migration: backup, dry run with before and after comparison, apply, safe repeat | `server/migrate.ts`, `npm run menu:migrate` |
| Admin: Master items (search, category and type filters, bulk show or hide per menu and buffet, add and edit drawer, categories), menu tabs (switch, price, offers allowed, section names, order with arrows, add items, add sections), buffet builder (multi select, sections, order, prices, offers, preview), offers reused | `src/staff/MenuManager.tsx` |
| Website safety fix: the delivery menu on the homepage no longer brings back old built in sections when a section is hidden, and new sections show at the end | `src/components/sections/MenuSection.tsx`, `MenuCategoryTabs.tsx` |
| Offers: items switched off on a menu can no longer be on offer, offer items carry the item id so renames follow | `src/data/content.ts` |

With `MENU_MODEL` not set (as now, locally and live), everything runs exactly as before, including the old editor.

## Test results

All on a copy of the local data, with a second local server using the new model, iPhone 14 in WebKit for
customer pages and the in app browser for the admin.

| Check | Result |
|-------|--------|
| Dry run on your real local data | 87 master items in 12 categories. Delivery, restaurant, bar, buffet: **0 unexpected differences**. Only the approved changes (Mixed Loaded Fries description, buffet "Chips" shown as Plain Chips). |
| Customer API, old model against new model | Delivery and restaurant identical. Bar and buffet differ only by the two approved changes. `/api/offers` identical. |
| Apply on the copy | Backup written first, 5 new documents written, old documents unchanged byte for byte. |
| Apply again | Kept all 5 existing new documents (no overwrite). New backup each run. |
| Rollback | Old documents still give the same menus. With the setting off, the old editor loads. |
| Storage not connected | Saving and apply are refused with "Storage is not connected". Dry run still works. The admin disables Save and shows a warning. |
| New item (Chicken 65): Delivery £11.99, Restaurant £9.99, Bar £10.99, buffet | Shows on all three menus at their own prices and in the buffet. |
| Rename Kottu to Kottu Roti | Renamed on all three menus, in the restaurant offer and in the buffet. |
| Delivery price change while only the bar is published | Delivery change stayed a draft, restaurant price unchanged. |
| Bar only: section renamed, item hidden, item moved | Customers see "Bar bites", item hidden with its £10.99 kept, order changed. Section anchor id unchanged. |
| Bulk hide all desserts on restaurant | Section disappears from the restaurant QR menu, link too. |
| Bulk hide all desserts on delivery | Homepage drops the section and its link (old prices never come back). |
| Archive Tiramisu | Gone from every menu and the buffet, nothing deleted. |
| Buffet: price £14.49, dish order, 2 dishes added, Adult buffet offer £12.99 | All shown on the website and the restaurant QR menu. Menu prices unchanged. |
| Customer pages on iPhone | No errors on restaurant QR, bar QR, homepage menu and buffet, offers page. |
| Admin on a phone (375 px) | No sideways scrolling on any tab. Drawer is a full screen sheet. |
| TypeScript and production build | Pass. |

Screenshots: `docs/screenshots/menu-audit-before/` (before) and `docs/screenshots/menu-centralised-after/`
(after, taken on the test copy, so they show test edits such as "Bar bites" and £14.49).

## Not done, or limited

- **Images:** an image web address with a preview. Uploading photos needs file storage (for example Vercel Blob) and is a separate step.
- **Dietary, allergens and images are stored but not shown to customers yet,** so the customer pages stay exactly as they are. Showing them is a design change for your approval.
- **Reordering** uses arrow buttons, not drag and drop. They work with touch and keyboards.
- **Homepage delivery layout** keeps its fixed design. A new delivery section appears at the end.
- **Publishing from a menu tab** also publishes Master items when they have unpublished changes, because the menu depends on them. The confirm box names both.
- **Printed PDFs** still come from the built in menus, as before.
- The project has no automated test suite. Checks were scripts, the dry run and browser tests.

## Next stages (each needs your approval)

1. **Commit and push the code.** The setting stays off, so the live site and admin keep working exactly as today.
2. **Local switch:** apply the migration to your local data and run local development on the new model.
3. **Production:** connect Upstash Redis in Vercel, run the dry run against it, apply (backup first), then set `MENU_MODEL=v2` in Vercel and redeploy. Rollback is removing that setting.
