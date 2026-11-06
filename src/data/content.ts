// Menu and offer content model, shared by the website, the QR table menus, the admin
// dashboard, the serverless API and the PDF scripts. It has no runtime imports on purpose,
// so every one of those can load it.
//
// Each venue (delivery, restaurant, bar) is one document holding its own menu AND its own
// offers. Offers can therefore never leak between venues: a restaurant offer cannot touch
// a bar price, and a delivery offer never appears on a dine in menu.
//
// Customers only ever see the PUBLISHED document, and only offers that pass liveOffers().
import type { BuffetGroup, MenuCategoryData } from "./menu";

export type Venue = "delivery" | "restaurant" | "bar";
export const VENUES: Venue[] = ["delivery", "restaurant", "bar"];

export const PENDING = "PENDING BUSINESS CONFIRMATION";

export interface OfferItem {
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
};

export const VENUE_TITLE: Record<Venue, string> = {
  delivery: "Delivery menu",
  restaurant: "Restaurant menu",
  bar: "Bar menu",
};

/** Offer templates per venue. Every field waits for business confirmation. */
export const seedOffers = (venue: Venue): Offer[] => {
  const base = { description: PENDING, value: PENDING, items: [], conditions: [PENDING], active: false, source: PENDING };
  if (venue === "delivery")
    return [{ ...base, id: "first-order-special", title: "First Order Special", venue, audience: "New delivery customers" }];
  if (venue === "restaurant")
    return [{ ...base, id: "restaurant-opening-offer", title: "Restaurant Opening Offer", venue, audience: "Dine in customers", conditions: ["Dine in only", PENDING] }];
  return [{ ...base, id: "bar-opening-offer", title: "Bar Opening Offer", venue, audience: "Bar customers", conditions: ["Bar only", PENDING] }];
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const menuPrices = (doc: Pick<MenuDoc, "categories">): Map<string, number> => {
  const prices = new Map<string, number>();
  for (const category of doc.categories) {
    if (category.kind === "items") for (const item of category.items) prices.set(item.name, item.price);
    else for (const deal of category.deals) prices.set(deal.name, deal.price);
  }
  return prices;
};

const todayIso = (today: Date): string => today.toISOString().slice(0, 10);

/** Reasons an offer cannot go live. An empty list means it is safe to show customers. */
export const offerProblems = (offer: Offer, doc: Pick<MenuDoc, "venue" | "categories">, today = new Date()): string[] => {
  const problems: string[] = [];
  if (offer.venue !== doc.venue) problems.push(`belongs to the ${offer.venue} menu, not ${doc.venue}`);
  if (JSON.stringify(offer).includes(PENDING)) problems.push("still has fields waiting for business confirmation");
  if (!offer.title.trim() || !offer.value.trim()) problems.push("needs a title and the offer itself");
  if (!offer.source.trim()) problems.push("needs a source (who confirmed it)");
  if (offer.starts && offer.expires && offer.starts > offer.expires) problems.push("starts after it ends");
  if (offer.expires && offer.expires < todayIso(today)) problems.push("has ended");
  if (doc.venue !== "delivery" && offer.items.length === 0) problems.push("needs at least one dish or drink with its offer price");
  const prices = menuPrices(doc);
  for (const item of offer.items) {
    const price = prices.get(item.name);
    if (price === undefined) problems.push(`"${item.name}" is not on the ${doc.venue} menu`);
    else if (round2(price) !== round2(item.originalPrice)) problems.push(`"${item.name}" regular price should be £${price.toFixed(2)}`);
    if (!(item.offerPrice > 0) || round2(item.offerPrice) >= round2(item.originalPrice)) problems.push(`"${item.name}" offer price must be above £0 and below the regular price`);
  }
  return problems;
};

/** Offers customers may see right now: active, fully confirmed, valid for this venue and in date. */
export const liveOffers = (doc: Pick<MenuDoc, "venue" | "categories" | "offers"> | null | undefined, today = new Date()): Offer[] =>
  (doc?.offers ?? []).filter(
    (offer) => offer.active && (!offer.starts || offer.starts <= todayIso(today)) && offerProblems(offer, doc!, today).length === 0,
  );

/** Shape checks for an admin save. Returns problems; empty means the document is acceptable. */
export const docProblems = (doc: MenuDoc, venue: Venue): string[] => {
  const problems: string[] = [];
  if (doc.venue !== venue) problems.push("Document is for a different menu.");
  if (!Array.isArray(doc.categories) || !Array.isArray(doc.offers)) problems.push("Menu or offers are missing.");
  for (const category of doc.categories ?? []) {
    const rows = category.kind === "items" ? category.items : category.deals;
    for (const row of rows) {
      if (!row.name?.trim()) problems.push(`A row in ${category.label} has no name.`);
      if (!(typeof row.price === "number" && row.price >= 0 && row.price < 1000)) problems.push(`${row.name}: price must be a number between £0 and £999.`);
    }
  }
  for (const offer of doc.offers ?? []) {
    if (offer.venue !== venue) problems.push(`Offer "${offer.title}" belongs to another menu.`);
    if (offer.active) for (const problem of offerProblems(offer, doc)) problems.push(`Offer "${offer.title}" ${problem}.`);
  }
  return problems;
};
