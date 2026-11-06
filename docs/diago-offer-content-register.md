# Diago Spice Resto Bar: offer content register

Rules (enforced in code by `src/data/content.ts` and `server/content.ts`):

1. Offers belong to exactly one menu: **delivery**, **restaurant** (dine in) or **bar**. Each menu
   document holds its own offers, so a restaurant offer can never touch a bar price, and a delivery
   offer never appears on a dine in menu.
2. An offer is shown to customers only when it is **switched on**, has **no field waiting for
   confirmation**, names **who confirmed it**, is **in date**, and every discounted item is on that
   menu with its **current price as the regular price** and an **offer price below it**.
3. Drafts are never public. Admins save a draft, preview it, then publish.
4. Nothing is invented: no percentages, prices, free items, conditions, dates, hours or links.

## Current register

| ID | Menu | Audience | Offer | Items and prices | Conditions | Dates | Status | Source |
|----|------|----------|-------|------------------|------------|-------|--------|--------|
| first-order-special | Delivery | New delivery customers | PENDING BUSINESS CONFIRMATION | PENDING | PENDING | none | Off (not shown) | PENDING |
| restaurant-opening-offer | Restaurant | Dine in customers | PENDING BUSINESS CONFIRMATION | PENDING | Dine in only, PENDING | none | Off (not shown) | PENDING |
| bar-opening-offer | Bar | Bar customers | PENDING BUSINESS CONFIRMATION | PENDING | Bar only, PENDING | none | Off (not shown) | PENDING |

Verified non offer information shown to customers:

| Item | Value | Source |
|------|-------|--------|
| Free delivery | Within 3 miles | Delivery menu document, owner |
| Delivery charge | £2 beyond 3 miles | Owner, chat 6 Nov 2026 |
| Minimum order | £15 to £20, depending on location | Owner, chat 6 Nov 2026 |
| Weekend buffet | Friday, Saturday, Sunday, 2pm to 12am, adults £13.99, kids under 10 £6.99 | Menu documents |

## Confirmation checklist (PENDING BUSINESS CONFIRMATION)

- [ ] First order delivery offer: what the customer gets, eligible items (if any), conditions,
      how a first order is identified on WhatsApp or phone, start and end dates.
- [ ] Restaurant opening offer: which dishes, regular price (must match the dine in menu), offer
      price, conditions, start and end dates.
- [ ] Bar opening offer: whether one exists at all; if yes, which items, offer prices, conditions, dates.
- [ ] General opening hours (only buffet hours are known today).
- [ ] Whether "Diago Spice Resto Bar" is the trading name to use everywhere (logo reads "Diago Spice Restaurant").

Enter confirmed offers in **/staff/ > Menus and offers** (admin), save, preview, publish.
