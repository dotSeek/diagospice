// Centralised menu model (version 2).
//
//   Master catalogue: every item once, with a permanent id, its name, description, type, deal
//   contents and optional verified details. Renaming an item renames it on every menu.
//   Menu config (delivery, restaurant, bar): which items are on that menu, in which section and
//   order, at what price, switched on or off, plus the menu's own section names and offers.
//   Buffet: its own document as before, with sections of item ids and its own two prices.
//
// Customers never see these documents directly: renderMenu() combines the catalogue and a menu
// config into the same MenuDoc shape the website, QR menus and offers page have always read, so
// customer pages, URLs and printed QR codes do not change.
//
// No runtime imports, so the site, the API, the admin and the migration script can all use it.
import type { BuffetInfo, MenuDoc, Offer } from "./content";
import type { MenuCategoryData } from "./menu";

export type MenuVenue = "delivery" | "restaurant" | "bar";
export const MENU_VENUES: MenuVenue[] = ["delivery", "restaurant", "bar"];
export type ItemType = "food" | "drink" | "deal";

/** The 14 allergens UK food law requires businesses to declare. Only ever set when verified. */
export const ALLERGENS = [
  "Celery",
  "Cereals containing gluten",
  "Crustaceans",
  "Eggs",
  "Fish",
  "Lupin",
  "Milk",
  "Molluscs",
  "Mustard",
  "Tree nuts",
  "Peanuts",
  "Sesame",
  "Soya",
  "Sulphites",
] as const;
export const DIETARY = ["Vegetarian", "Vegan", "Halal", "Gluten free", "Spicy"] as const;

export interface CatalogueCategory {
  id: string;
  name: string;
  type: ItemType;
}

export interface CatalogueItem {
  /** Permanent. Never changes, even when the item is renamed. */
  id: string;
  name: string;
  description?: string;
  type: ItemType;
  /** Deals only: what the deal includes. */
  includes?: string[];
  /** Home category, used when the item is added to a menu. */
  categoryId: string;
  image?: string;
  dietary?: string[];
  allergens?: string[];
  status: "active" | "archived";
}

export interface Catalogue {
  version: 2;
  categories: CatalogueCategory[];
  items: CatalogueItem[];
  updated: string;
  updatedBy?: string;
}

export interface MenuSection {
  /** The anchor id customers' pages use (kept from the old menus, for example "bar-mains"). */
  id: string;
  categoryId: string;
  /** This menu's own name for the section, for example "Mains with rice or nan". */
  label: string;
}

export interface MenuEntry {
  itemId: string;
  /** Which of this menu's sections it sits in (MenuSection.id). */
  sectionId: string;
  /** This menu's price. Kept when the item is switched off. */
  price: number;
  visible: boolean;
  /** False keeps the item out of offers on this menu. */
  offerEligible: boolean;
}

export interface MenuConfig {
  version: 2;
  venue: MenuVenue;
  title: string;
  note: string;
  /** In display order. */
  sections: MenuSection[];
  /** In display order within each section. */
  entries: MenuEntry[];
  offers: Offer[];
  updated: string;
  updatedBy?: string;
}

/** Buffet document in version 2: as before, plus item ids for every buffet dish. */
export type BuffetDoc = Omit<MenuDoc, "venue" | "buffet"> & { venue: "buffet"; buffet: Omit<BuffetInfo, "groups"> & { groups: BuffetGroupV2[] } };
export interface BuffetGroupV2 {
  title: string;
  /** Display names, filled in from the catalogue. */
  items: string[];
  itemIds: string[];
}

export const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** A permanent id for a new item or category that is not already taken. */
export const newId = (prefix: "item" | "cat", name: string, taken: Iterable<string>): string => {
  const used = new Set(taken);
  const base = `${prefix}-${slug(name) || "new"}`;
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  return id;
};

// ---------- customer view ----------

/**
 * The menu customers see: visible entries of active catalogue items, grouped in this menu's
 * sections, with this menu's prices. Offer items get their current names from the catalogue.
 * Pass `includeHidden` for the admin's own view.
 */
export const renderMenu = (catalogue: Catalogue, config: MenuConfig, includeHidden = false): MenuDoc => {
  const items = new Map(catalogue.items.map((item) => [item.id, item]));
  const categories: MenuCategoryData[] = [];
  for (const section of config.sections) {
    const entries = config.entries.filter((entry) => entry.sectionId === section.id && (includeHidden || entry.visible)).filter((entry) => items.get(entry.itemId)?.status === "active");
    const kind = catalogue.categories.find((category) => category.id === section.categoryId)?.type === "deal" ? "deals" : "items";
    if (!entries.length && !includeHidden) continue;
    if (kind === "deals")
      categories.push({
        id: section.id,
        label: section.label,
        kind,
        deals: entries.map((entry) => {
          const item = items.get(entry.itemId)!;
          return { name: item.name, price: entry.price, includes: item.includes ?? [], ...(entry.visible ? {} : { hidden: true }) };
        }),
      });
    else
      categories.push({
        id: section.id,
        label: section.label,
        kind,
        items: entries.map((entry) => {
          const item = items.get(entry.itemId)!;
          return { name: item.name, price: entry.price, ...(item.description ? { note: item.description } : {}), ...(entry.visible ? {} : { hidden: true }) };
        }),
      });
  }
  const eligible = new Set(config.entries.filter((entry) => entry.offerEligible).map((entry) => entry.itemId));
  const offers = config.offers.map((offer) => ({
    ...offer,
    items: offer.items
      .filter((item) => !item.itemId || eligible.has(item.itemId))
      .map((item) => (item.itemId && items.has(item.itemId) ? { ...item, name: items.get(item.itemId)!.name } : item)),
  }));
  return { venue: config.venue, title: config.title, note: config.note, categories, offers, updated: config.updated, ...(config.updatedBy ? { updatedBy: config.updatedBy } : {}) };
};

/** The buffet as customers see it: dish names come from the catalogue, archived dishes drop out. */
export const renderBuffet = (catalogue: Catalogue, doc: BuffetDoc): MenuDoc => {
  const items = new Map(catalogue.items.map((item) => [item.id, item]));
  return {
    ...doc,
    venue: "buffet",
    buffet: {
      ...doc.buffet,
      groups: doc.buffet.groups
        .map((group) => ({ title: group.title, items: group.itemIds.filter((id) => items.get(id)?.status === "active").map((id) => items.get(id)!.name) }))
        .filter((group) => group.items.length),
    },
  };
};

// ---------- checks ----------

const plain = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max && !/[<>]/.test(value);

export const catalogueProblems = (catalogue: Catalogue): string[] => {
  const problems: string[] = [];
  if (catalogue?.version !== 2 || !Array.isArray(catalogue.items) || !Array.isArray(catalogue.categories)) return ["The master item list is not valid."];
  const categoryIds = new Set<string>();
  for (const category of catalogue.categories) {
    if (!plain(category.id, 80) || !plain(category.name, 40) || !category.name.trim()) problems.push("Every category needs a name under 40 characters, without < or >.");
    if (categoryIds.has(category.id)) problems.push(`Category ${category.name} is listed twice.`);
    categoryIds.add(category.id);
  }
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const item of catalogue.items) {
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!plain(item.id, 80) || ids.has(item.id)) problems.push(`${name || "An item"} has a missing or repeated id.`);
    ids.add(item.id);
    if (!name || !plain(name, 60)) problems.push(`${name.slice(0, 60) || "An item"}: names must be under 60 characters, without < or >.`);
    else if (item.status === "active" && names.has(name.toLowerCase())) problems.push(`${name} is in the master list twice. Each item needs its own name.`);
    if (item.status === "active") names.add(name.toLowerCase());
    if (item.description !== undefined && !plain(item.description, 120)) problems.push(`${name}: the description must be plain text under 120 characters.`);
    if (!categoryIds.has(item.categoryId)) problems.push(`${name}: choose a category.`);
    if (!["food", "drink", "deal"].includes(item.type)) problems.push(`${name}: choose food, drink or deal.`);
    if (item.type === "deal" && !(Array.isArray(item.includes) && item.includes.length && item.includes.every((line) => plain(line, 120))))
      problems.push(`${name}: list what the deal includes.`);
    if (item.image !== undefined && !(plain(item.image, 300) && /^(https:\/\/|\/)[^\s]*$/.test(item.image))) problems.push(`${name}: the image must be a web address starting with https:// or /.`);
    for (const [label, list] of [["dietary", item.dietary], ["allergen", item.allergens]] as const)
      if (list !== undefined && !(Array.isArray(list) && list.every((entry) => plain(entry, 40)))) problems.push(`${name}: the ${label} details are not valid.`);
    if (!["active", "archived"].includes(item.status)) problems.push(`${name}: the status is not valid.`);
  }
  return problems;
};

/** Checks a menu config against the catalogue it will be shown with. */
export const configProblems = (config: MenuConfig, venue: MenuVenue, catalogue: Catalogue): string[] => {
  const problems: string[] = [];
  if (config?.version !== 2 || config.venue !== venue || !Array.isArray(config.sections) || !Array.isArray(config.entries) || !Array.isArray(config.offers))
    return ["This menu is not valid."];
  const items = new Map(catalogue.items.map((item) => [item.id, item]));
  const sectionIds = new Set<string>();
  for (const section of config.sections) {
    if (!plain(section.label, 40) || !section.label.trim()) problems.push("Every section needs a name under 40 characters, without < or >.");
    if (!plain(section.id, 80) || sectionIds.has(section.id)) problems.push(`Section ${section.label} has a missing or repeated id.`);
    sectionIds.add(section.id);
  }
  const seen = new Set<string>();
  for (const entry of config.entries) {
    const item = items.get(entry.itemId);
    const name = item?.name ?? entry.itemId;
    if (!item) problems.push(`${name} is not in the published master items. Publish the master items first.`);
    if (seen.has(entry.itemId)) problems.push(`${name} is on this menu twice.`);
    seen.add(entry.itemId);
    if (!sectionIds.has(entry.sectionId)) problems.push(`${name}: choose a section.`);
    if (!(typeof entry.price === "number" && Number.isFinite(entry.price) && entry.price >= 0 && entry.price < 1000)) problems.push(`${name}: the price must be between £0 and £999.`);
    else if (entry.visible && !(entry.price > 0)) problems.push(`${name}: enter a price before switching it on.`);
  }
  return problems;
};

// ---------- migration from the old per menu documents ----------

export interface MigrationReport {
  items: { id: string; name: string; type: ItemType; categoryId: string; menus: Partial<Record<MenuVenue, { section: string; price: number }>>; buffet: boolean; note: string }[];
  decisions: string[];
}

/** Approved answers to the audit questions (docs/diago-menu-centralisation-audit.md, section 5). */
const DESCRIPTION_OVERRIDE: Record<string, string> = { "Mixed Loaded Fries": "Chicken and doner" }; // C
const BUFFET_LINKS: Record<string, string> = { Chips: "Plain Chips" }; // E
const BUFFET_ONLY_CATEGORY: Record<string, string> = { "Aloo Keema": "mains", "Daal Makhni": "mains", "Cauliflower 65": "starters" }; // F
const DRINK_SECTIONS = new Set(["soft-drinks"]);

const sectionKey = (id: string) => id.replace(/^bar-/, "");

/**
 * Builds the version 2 documents from the current menus. Items with the same name on several
 * menus become one item (audit answers A and B: bar curries and burgers are the same dishes, the
 * bar's section names keep "with rice or nan" and "with chips"). Every price, section name, order,
 * offer and buffet dish is kept.
 */
export const migrateLegacy = (legacy: Record<MenuVenue, MenuDoc> & { buffet: MenuDoc }, stamp: string) => {
  const categories = new Map<string, CatalogueCategory>();
  const items = new Map<string, CatalogueItem>();
  const report: MigrationReport = { items: [], decisions: [] };
  const byName = (name: string) => items.get(name.toLowerCase());

  for (const venue of MENU_VENUES)
    for (const category of legacy[venue].categories) {
      const key = sectionKey(category.id);
      const categoryId = `cat-${key}`;
      if (!categories.has(categoryId))
        categories.set(categoryId, { id: categoryId, name: category.label, type: category.kind === "deals" ? "deal" : DRINK_SECTIONS.has(key) ? "drink" : "food" });
      const rows = category.kind === "items" ? category.items : category.deals;
      for (const row of rows) {
        if (byName(row.name)) continue;
        const item: CatalogueItem = {
          id: newId("item", row.name, [...items.values()].map((entry) => entry.id)),
          name: row.name,
          type: categories.get(categoryId)!.type,
          categoryId,
          status: "active",
        };
        const description = DESCRIPTION_OVERRIDE[row.name] ?? ("note" in row ? row.note : undefined);
        if (description) item.description = description;
        if ("includes" in row) item.includes = [...row.includes];
        items.set(row.name.toLowerCase(), item);
      }
    }
  for (const [name, to] of Object.entries(DESCRIPTION_OVERRIDE)) report.decisions.push(`${name}: one description on every menu, "${to}".`);

  const configs = {} as Record<MenuVenue, MenuConfig>;
  for (const venue of MENU_VENUES) {
    const doc = legacy[venue];
    const sections: MenuSection[] = doc.categories.map((category) => ({ id: category.id, categoryId: `cat-${sectionKey(category.id)}`, label: category.label }));
    const entries: MenuEntry[] = doc.categories.flatMap((category) =>
      (category.kind === "items" ? category.items : category.deals).map((row) => ({
        itemId: byName(row.name)!.id,
        sectionId: category.id,
        price: row.price,
        visible: !row.hidden,
        offerEligible: true,
      })),
    );
    const offers = doc.offers.map((offer) => ({ ...offer, items: offer.items.map((item) => ({ ...item, itemId: byName(item.name)?.id })) }));
    configs[venue] = { version: 2, venue, title: doc.title, note: doc.note, sections, entries, offers, updated: stamp, ...(doc.updatedBy ? { updatedBy: doc.updatedBy } : {}) };
  }

  // Buffet: link every dish to an item, creating the approved buffet only dishes.
  const buffetSource = legacy.buffet.buffet!;
  const groups: BuffetGroupV2[] = (buffetSource.groups ?? []).map((group) => ({
    title: group.title,
    items: [],
    itemIds: group.items.map((dish) => {
      const linked = BUFFET_LINKS[dish];
      let item = byName(linked ?? dish);
      if (linked) report.decisions.push(`Buffet "${dish}" linked to ${linked}.`);
      if (!item) {
        const categoryId = `cat-${BUFFET_ONLY_CATEGORY[dish] ?? "mains"}`;
        item = { id: newId("item", dish, [...items.values()].map((entry) => entry.id)), name: dish, type: "food", categoryId, status: "active" };
        items.set(dish.toLowerCase(), item);
        report.decisions.push(`${dish}: created as a buffet only item (no menu, no price).`);
      }
      return item.id;
    }),
  }));
  const catalogue: Catalogue = { version: 2, categories: [...categories.values()], items: [...items.values()], updated: stamp };
  for (const group of groups) group.items = group.itemIds.map((id) => catalogue.items.find((item) => item.id === id)!.name);
  const buffet: BuffetDoc = {
    ...legacy.buffet,
    venue: "buffet",
    categories: [],
    buffet: { ...buffetSource, groups },
    offers: legacy.buffet.offers.map((offer) => ({ ...offer })),
    updated: stamp,
  };

  const inBuffet = new Set(groups.flatMap((group) => group.itemIds));
  for (const item of catalogue.items)
    report.items.push({
      id: item.id,
      name: item.name,
      type: item.type,
      categoryId: item.categoryId,
      menus: Object.fromEntries(
        MENU_VENUES.flatMap((venue) => {
          const entry = configs[venue].entries.find((row) => row.itemId === item.id);
          return entry ? [[venue, { section: configs[venue].sections.find((section) => section.id === entry.sectionId)!.label, price: entry.price }]] : [];
        }),
      ),
      buffet: inBuffet.has(item.id),
      note: item.description ?? (item.includes ?? []).join(", "),
    });
  return { catalogue, configs, buffet, report };
};
