// Menu and offer content model, shared by the website, the QR table menus, the admin
// dashboard, the serverless API and the PDF scripts. It has no runtime imports on purpose,
// so every one of those can load it.
//
// Each venue (delivery, restaurant, bar, buffet) is one document holding its own menu AND its own
// offers. The buffet document has no menu sections of its own: its dishes are picked from the
// restaurant menu by name, and its two prices (adults, kids) live only in the buffet document, so
// buffet pricing and buffet offers never change a restaurant price. Offers can therefore never leak between venues: a restaurant offer cannot touch
// a bar price, and a delivery offer never appears on a dine in menu.
//
// Customers only ever see the PUBLISHED document, and only offers that pass liveOffers().
import type { BuffetGroup, MenuCategoryData } from "./menu";

export type Venue = "delivery" | "restaurant" | "bar" | "buffet";
export const VENUES: Venue[] = ["delivery", "restaurant", "bar", "buffet"];

/** Offer item names for the two buffet prices. Buffet offers discount these, never a dish. */
export const BUFFET_ADULT = "Adult buffet";
export const BUFFET_KIDS = "Kids buffet";

export const PENDING = "PENDING BUSINESS CONFIRMATION";

export interface OfferItem {
  /** Permanent master item id (centralised menus). Older offers only have the name. */
  itemId?: string;
  /** Must match a dish or drink name on the same venue's menu. */
  name: string;
  /** Must equal that item's current menu price. */
  originalPrice: number;
  /** Must be lower than originalPrice. */
  offerPrice: number;
}

export interface Offer {
  id: string;
  title: string;
  venue: Venue;
  audience: string;
  description: string;
  /** The confirmed offer itself, for example "10% off your first order". */
  value: string;
  /** Discounted items. Empty for whole order offers such as a first order discount. */
  items: OfferItem[];
  conditions: string[];
  /** Optional ISO dates (YYYY-MM-DD), only when confirmed. */
  starts?: string;
  expires?: string;
  /** Switched on by an admin. Inactive offers never show. */
  active: boolean;
  /** Who confirmed it and how, for example "Owner, WhatsApp 6 Nov 2026". */
  source: string;
}

export interface BuffetInfo {
  days: string;
  hours: string;
  bookingPhone: string;
  adultPrice: number;
  kidsPrice: number;
  kidsNote: string;
  groups?: BuffetGroup[];
}

export interface MenuDoc {
  venue: Venue;
  title: string;
  note: string;
  categories: MenuCategoryData[];
  buffet?: BuffetInfo;
  offers: Offer[];
  /** ISO timestamp of the last save. */
  updated: string;
  updatedBy?: string;
}

/** Badge text that marks which venue an offer belongs to. */
export const OFFER_LABEL: Record<Venue, string> = {
  delivery: "Delivery only",
  restaurant: "Opening Special",
  bar: "Bar Opening Special",
  buffet: "Buffet Special",
};

export const VENUE_TITLE: Record<Venue, string> = {
  delivery: "Delivery menu",
  restaurant: "Restaurant menu",
  bar: "Bar menu",
  buffet: "Buffet Special Menu",
};

/** Offer templates per venue. Every field waits for business confirmation. */
export const seedOffers = (venue: Venue): Offer[] => {
  const base = { description: PENDING, value: PENDING, items: [], conditions: [PENDING], active: false, source: PENDING };
  if (venue === "delivery")
    return [{ ...base, id: "first-order-special", title: "First Order Special", venue, audience: "New delivery customers" }];
  if (venue === "restaurant")
    return [{ ...base, id: "restaurant-opening-offer", title: "Restaurant Opening Offer", venue, audience: "Dine in customers", conditions: ["Dine in only", PENDING] }];
  if (venue === "buffet") return [];
  return [{ ...base, id: "bar-opening-offer", title: "Bar Opening Offer", venue, audience: "Bar customers", conditions: ["Bar only", PENDING] }];
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const menuPrices = (doc: Pick<MenuDoc, "categories"> & { venue?: Venue; buffet?: BuffetInfo }): Map<string, number> => {
  const prices = new Map<string, number>();
  if (doc.venue === "buffet" && doc.buffet) {
    prices.set(BUFFET_ADULT, doc.buffet.adultPrice);
    prices.set(BUFFET_KIDS, doc.buffet.kidsPrice);
  }
  for (const category of doc.categories) {
    // Items switched off on this menu cannot be on offer.
    if (category.kind === "items") for (const item of category.items) !item.hidden && prices.set(item.name, item.price);
    else for (const deal of category.deals) !deal.hidden && prices.set(deal.name, deal.price);
  }
  return prices;
};

const todayIso = (today: Date): string => today.toISOString().slice(0, 10);

/** Reasons an offer cannot go live. An empty list means it is safe to show customers. */
export const offerProblems = (offer: Offer, doc: Pick<MenuDoc, "venue" | "categories" | "buffet">, today = new Date()): string[] => {
  const problems: string[] = [];
  if (offer.venue !== doc.venue) problems.push(`It belongs to the ${offer.venue} menu, not the ${doc.venue} menu`);
  if (JSON.stringify(offer).includes(PENDING)) problems.push("Some details still wait for business confirmation");
  if (!offer.title.trim() || !offer.value.trim()) problems.push("Fill in the offer name and what the customer gets");
  if (!offer.source.trim()) problems.push("Add who confirmed the offer");
  if (offer.starts && offer.expires && offer.starts > offer.expires) problems.push("The start date is after the end date");
  if (offer.expires && offer.expires < todayIso(today)) problems.push("The end date has passed");
  if (doc.venue !== "delivery" && offer.items.length === 0)
    problems.push(doc.venue === "buffet" ? "Add the adult or kids buffet price with its offer price" : "Add at least one dish or drink with its offer price");
  const prices = menuPrices(doc);
  for (const item of offer.items) {
    const price = prices.get(item.name);
    if (price === undefined) problems.push(`${item.name} is not on the ${VENUE_TITLE[doc.venue].toLowerCase()}`);
    else if (round2(price) !== round2(item.originalPrice)) problems.push(`${item.name}: the regular price is now £${price.toFixed(2)}, please re add it`);
    if (!(item.offerPrice > 0) || round2(item.offerPrice) >= round2(item.originalPrice)) problems.push(`${item.name}: enter an offer price below the regular £${item.originalPrice.toFixed(2)}`);
  }
  return problems;
};

/** Offers customers may see right now: active, fully confirmed, valid for this venue and in date. */
export const liveOffers = (doc: Pick<MenuDoc, "venue" | "categories" | "offers" | "buffet"> | null | undefined, today = new Date()): Offer[] =>
  (doc?.offers ?? []).filter(
    (offer) => offer.active && (!offer.starts || offer.starts <= todayIso(today)) && offerProblems(offer, doc!, today).length === 0,
  );

/** Shape checks for an admin save. Returns problems; empty means the document is acceptable. */
export const docProblems = (doc: MenuDoc, venue: Venue): string[] => {
  const problems: string[] = [];
  if (doc.venue !== venue) problems.push("Document is for a different menu.");
  if (!Array.isArray(doc.categories) || !Array.isArray(doc.offers)) problems.push("Menu or offers are missing.");
  const seen = new Set<string>();
  for (const category of doc.categories ?? []) {
    const rows = category.kind === "items" ? category.items : category.deals;
    if (!Array.isArray(rows)) {
      problems.push(`${category.label} has no items list.`);
      continue;
    }
    for (const row of rows) {
      const name = typeof row.name === "string" ? row.name.trim() : "";
      if (!name) problems.push(`A row in ${category.label} has no name.`);
      else if (name.length > 60 || /[<>]/.test(name)) problems.push(`${name.slice(0, 60)}: names must be under 60 characters, without < or >.`);
      else if (seen.has(name.toLowerCase())) problems.push(`${name} is on this menu twice. Each item needs its own name.`);
      seen.add(name.toLowerCase());
      if (!(typeof row.price === "number" && row.price >= 0 && row.price < 1000)) problems.push(`${name}: price must be a number between £0 and £999.`);
      const extra = "note" in row ? [row.note ?? ""] : "includes" in row ? row.includes : [];
      if (!Array.isArray(extra) || extra.some((text) => typeof text !== "string" || text.length > 120 || /[<>]/.test(text)))
        problems.push(`${name}: notes must be plain text under 120 characters.`);
      if (category.kind === "deals" && !("includes" in row && Array.isArray(row.includes) && row.includes.length)) problems.push(`${name}: list what the deal includes.`);
    }
  }
  if (venue === "buffet" && !doc.buffet) problems.push("Buffet details are missing.");
  if (doc.buffet) {
    const b = doc.buffet;
    const text = (value: unknown, max: number) => typeof value === "string" && value.length <= max && !/[<>]/.test(value);
    if (!b.days?.trim() || !b.hours?.trim()) problems.push("Buffet: fill in the days and hours.");
    if (![b.days, b.hours, b.bookingPhone, b.kidsNote].every((value) => text(value, 80))) problems.push("Buffet: days, hours, phone and kids note must be plain text under 80 characters.");
    for (const [label, value] of [["adult", b.adultPrice], ["kids", b.kidsPrice]] as const)
      if (!(typeof value === "number" && value > 0 && value < 1000)) problems.push(`Buffet: the ${label} price must be between £0.01 and £999.`);
    if (b.groups !== undefined) {
      if (!Array.isArray(b.groups) || b.groups.length > 20) problems.push("Buffet: the dish sections are not valid.");
      else {
        const dishes = new Set<string>();
        for (const group of b.groups) {
          if (!text(group?.title, 40) || !group.title.trim()) problems.push("Buffet: every section needs a name under 40 characters.");
          if (!Array.isArray(group?.items) || group.items.length > 60) {
            problems.push(`Buffet: ${group?.title ?? "a section"} has no dish list.`);
            continue;
          }
          for (const dish of group.items) {
            if (!text(dish, 60) || !dish.trim()) problems.push(`Buffet: ${group.title} has a dish name that is empty, too long or contains < or >.`);
            else if (dishes.has(dish.toLowerCase())) problems.push(`Buffet: ${dish} is in the buffet twice.`);
            dishes.add(String(dish).toLowerCase());
          }
        }
      }
    }
  }
  for (const offer of doc.offers ?? []) {
    if (offer.venue !== venue) problems.push(`${offer.title}: it belongs to another menu.`);
    if (offer.active) for (const problem of offerProblems(offer, doc)) problems.push(`${offer.title}: ${problem}.`);
  }
  return problems;
};
