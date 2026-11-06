// Migration from the legacy per menu documents to the v2 centralised model.
//
//   dryRun()  builds the v2 documents in memory and compares, for every menu, what customers see
//             today with what they would see after. Writes nothing.
//   apply()   writes a full backup of every legacy document first, then the v2 documents under
//             new keys. Legacy documents are never changed or deleted. A v2 document that already
//             exists (an admin has edited or published in v2) is kept unless force is set, so the
//             migration can be run again safely.
//
// Run with `npm run menu:migrate` (dry run) or `npm run menu:migrate -- --apply`.
import { VENUES } from "../src/data/content.js";
import type { MenuDoc, Venue } from "../src/data/content.js";
import { MENU_VENUES, renderBuffet, renderMenu } from "../src/data/catalogue.js";
import { forCustomers, getStore, legacyKey, legacyPublished, migrated, v2Key } from "./content.js";

/** The parts of a menu customers can see, flattened to comparable lines. The weekend buffet is
 *  read by customer pages from the buffet document only (an old copy inside the delivery and
 *  restaurant documents is unused), so it is compared on the buffet menu only. */
const visible = (doc: MenuDoc): string[] => {
  const lines: string[] = [];
  for (const category of doc.categories) {
    lines.push(`section ${category.id} "${category.label}"`);
    if (category.kind === "items") for (const item of category.items) lines.push(`  ${category.id} | ${item.name} | £${item.price.toFixed(2)} | ${item.note ?? ""}`);
    else for (const deal of category.deals) lines.push(`  ${category.id} | ${deal.name} | £${deal.price.toFixed(2)} | ${deal.includes.join(", ")}`);
  }
  for (const offer of doc.offers) lines.push(`offer ${offer.id} "${offer.title}" ${offer.items.map((item) => `${item.name} £${item.originalPrice.toFixed(2)} to £${item.offerPrice.toFixed(2)}`).join(", ")}`);
  if (doc.venue === "buffet" && doc.buffet) {
    const b = doc.buffet;
    lines.push(`buffet ${b.days} | ${b.hours} | £${b.adultPrice.toFixed(2)} | £${b.kidsPrice.toFixed(2)} | ${b.kidsNote} | ${b.bookingPhone}`);
    for (const group of b.groups ?? []) lines.push(`  buffet ${group.title}: ${group.items.join(", ")}`);
  }
  return lines;
};

/** Differences the owner approved in the audit (answers C and E), so they are not counted as errors. */
const APPROVED = [/Mixed Loaded Fries \| £[\d.]+ \| (Doner and chicken|Chicken and doner)$/, /^ {2}buffet Diago special foods: .*\b(Chips|Plain Chips)$/];

const diff = (before: string[], after: string[]) => {
  const removed = before.filter((line) => !after.includes(line));
  const added = after.filter((line) => !before.includes(line));
  const approved = (line: string) => APPROVED.some((pattern) => pattern.test(line));
  return { removed: removed.filter((line) => !approved(line)), added: added.filter((line) => !approved(line)), approved: [...removed, ...added].filter(approved) };
};

export async function dryRun() {
  const legacy = await legacyPublished();
  const { catalogue, configs, buffet, report } = await migrated();
  const menus: Record<string, ReturnType<typeof diff> & { lines: number }> = {};
  for (const venue of VENUES) {
    const before = visible(forCustomers(legacy[venue]));
    const after = visible(forCustomers(venue === "buffet" ? renderBuffet(catalogue, buffet) : renderMenu(catalogue, configs[venue])));
    menus[venue] = { ...diff(before, after), lines: before.length };
  }
  const drafts: string[] = [];
  for (const venue of VENUES) if (await getStore().get(legacyKey(venue, "draft"))) drafts.push(venue);
  const unexpected = Object.values(menus).reduce((sum, menu) => sum + menu.removed.length + menu.added.length, 0);
  return {
    storage: getStore().kind,
    items: catalogue.items.length,
    categories: catalogue.categories.length,
    report,
    menus,
    unexpected,
    legacyDrafts: drafts,
  };
}

export async function apply({ force = false } = {}) {
  const check = await dryRun();
  if (check.unexpected) throw new Error(`Stopped: ${check.unexpected} unexpected differences in what customers would see. Nothing was written.`);
  if (check.storage === "read-only") throw new Error("Storage is not connected, so nothing can be written.");
  const store = getStore();
  const stamp = new Date().toISOString();

  // 1. Backup of every legacy document, drafts included, before anything is written.
  const backup: Record<string, unknown> = { stamp };
  for (const venue of VENUES)
    for (const state of ["draft", "published"] as const) backup[`${venue}:${state}`] = await store.get<MenuDoc>(legacyKey(venue, state));
  backup.builtIn = await legacyPublished();
  const backupKey = `diago:backup:${stamp.replace(/[:.]/g, "-")}`;
  await store.set(backupKey, backup);

  // 2. v2 documents, keeping any that already exist unless forced.
  const { catalogue, configs, buffet } = await migrated();
  const writes: [string, unknown][] = [[v2Key("catalogue", "published"), { ...catalogue, updated: stamp }]];
  for (const venue of MENU_VENUES) writes.push([v2Key(venue, "published"), { ...configs[venue], updated: stamp }]);
  writes.push([v2Key("buffet" as Venue, "published"), { ...buffet, updated: stamp }]);
  const written: string[] = [];
  const kept: string[] = [];
  for (const [key, value] of writes) {
    if (!force && (await store.get(key))) {
      kept.push(key);
      continue;
    }
    await store.set(key, value);
    written.push(key);
  }
  return { backupKey, written, kept, legacyDrafts: check.legacyDrafts };
}
