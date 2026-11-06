// Menu and offer storage plus the public and admin endpoints.
//
// Storage, in order of preference:
//   1. Upstash Redis, when UPSTASH_REDIS_REST_URL/TOKEN (or Vercel's KV_REST_API_URL/TOKEN) are set
//   2. Local JSON files in private/store/ (or STORE_DIR) during local development (never on Vercel)
//   3. Read only: the built in menus (src/data/menu.ts and private/encrypted/*.json.enc)
//
// Two menu models live side by side:
//   legacy  one full document per menu (diago:menu:{venue}:{state}). The default.
//   v2      a master catalogue plus one config per menu (diago:v2:...), switched on with
//           MENU_MODEL=v2. Until the migration is applied, v2 is built on the fly from the legacy
//           documents, so switching it on never changes what customers see. Switching it off is the
//           rollback: the legacy documents are never changed or deleted by v2.
//
// Each document keeps a draft and a published copy. Customers only ever get published copies, and
// only offers that pass liveOffers(). Admins edit the draft, preview it, then publish.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { Redis } from "@upstash/redis";
import { VENUES, docProblems, liveOffers, seedOffers } from "../src/data/content.js";
import type { MenuDoc, Venue } from "../src/data/content.js";
import { MENU_VENUES, catalogueProblems, configProblems, migrateLegacy, renderBuffet, renderMenu } from "../src/data/catalogue.js";
import type { BuffetDoc, Catalogue, MenuConfig, MenuVenue } from "../src/data/catalogue.js";
import { buffet, menuCategories } from "../src/data/menu.js";
import { currentSession, decryptFile, json, readBody, sameOrigin } from "./staff.js";

type State = "draft" | "published";

export interface Store {
  kind: "redis" | "file" | "read-only";
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
}

const legacyKey = (venue: Venue, state: State) => `diago:menu:${venue}:${state}`;
const v2Key = (doc: "catalogue" | Venue, state: State) => (doc === "catalogue" ? `diago:v2:catalogue:${state}` : `diago:v2:menu:${doc}:${state}`);

const createStore = (): Store => {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) {
    const redis = new Redis({ url, token });
    return {
      kind: "redis",
      get: (key) => redis.get(key),
      set: async (key, value) => void (await redis.set(key, value)),
      del: async (key) => void (await redis.del(key)),
    };
  }
  if (!process.env.VERCEL) {
    const dir = process.env.STORE_DIR || join(process.cwd(), "private", "store");
    // Legacy files keep their original names (restaurant-published.json); everything else is
    // named after its key (v2-catalogue-draft.json, backup-....json).
    const file = (key: string) => {
      const legacy = key.match(/^diago:menu:([a-z]+):([a-z]+)$/);
      return join(dir, legacy ? `${legacy[1]}-${legacy[2]}.json` : `${key.replace(/^diago:/, "").replace(/[^a-z0-9-]+/gi, "-")}.json`);
    };
    return {
      kind: "file",
      get: async (key) => (existsSync(file(key)) ? JSON.parse(readFileSync(file(key), "utf8")) : null),
      set: async (key, value) => {
        mkdirSync(dir, { recursive: true });
        writeFileSync(file(key), JSON.stringify(value, null, 2));
      },
      del: async (key) => rmSync(file(key), { force: true }),
    };
  }
  return {
    kind: "read-only",
    get: async () => null,
    set: async () => {
      throw new Error("Storage is not connected. Add Upstash Redis to the Vercel project.");
    },
    del: async () => undefined,
  };
};

let store: Store | null = null;
export const getStore = (): Store => (store ??= createStore());
export const menuModel = (): "legacy" | "v2" => (process.env.MENU_MODEL === "v2" ? "v2" : "legacy");

// ---------- legacy documents ----------

/** The built in menu for a venue, used until an admin publishes a change. */
const seed = (venue: Venue): MenuDoc => {
  const updated = "2026-11-06T00:00:00.000Z";
  if (venue === "delivery") {
    return {
      venue,
      title: "Delivery menu",
      note: "Free delivery within 3 miles. £2 delivery charge beyond 3 miles. Minimum order £15 to £20.",
      categories: menuCategories,
      buffet,
      offers: seedOffers(venue),
      updated,
    };
  }
  const built = JSON.parse(decryptFile(`${venue}-menu.json.enc`).toString("utf8")) as Omit<MenuDoc, "offers">;
  return { ...built, venue, offers: seedOffers(venue), updated };
};

/** The buffet starts from the weekend buffet details already published on the restaurant menu. */
const seedBuffet = async (): Promise<MenuDoc> => {
  const restaurantDoc = (await getStore().get<MenuDoc>(legacyKey("restaurant", "published"))) ?? seed("restaurant");
  const base = restaurantDoc.buffet ?? buffet;
  return {
    venue: "buffet",
    title: "Buffet Special Menu",
    note: "All you can eat, dine in only.",
    categories: [],
    buffet: {
      days: base.days,
      hours: base.hours,
      bookingPhone: base.bookingPhone,
      adultPrice: base.adultPrice,
      kidsPrice: base.kidsPrice,
      kidsNote: base.kidsNote,
      groups: structuredClone(base.groups?.length ? base.groups : buffet.groups),
    },
    offers: seedOffers("buffet"),
    updated: "2026-11-06T00:00:00.000Z",
  };
};

export const published = async (venue: Venue): Promise<MenuDoc> =>
  (await getStore().get<MenuDoc>(legacyKey(venue, "published"))) ?? (venue === "buffet" ? await seedBuffet() : seed(venue));
const draft = async (venue: Venue): Promise<MenuDoc> => (await getStore().get<MenuDoc>(legacyKey(venue, "draft"))) ?? (await published(venue));

/** Every legacy document as customers see it today, the input to the v2 migration. */
export const legacyPublished = async () => ({
  delivery: await published("delivery"),
  restaurant: await published("restaurant"),
  bar: await published("bar"),
  buffet: await published("buffet"),
});

// ---------- v2 documents ----------

/** The v2 documents built from today's legacy menus (what the migration would write). */
export const migrated = async () => migrateLegacy(await legacyPublished(), "2026-11-06T00:00:00.000Z");

type V2Doc = "catalogue" | Venue;
type V2Value<D extends V2Doc> = D extends "catalogue" ? Catalogue : D extends "buffet" ? BuffetDoc : MenuConfig;

const v2Published = async <D extends V2Doc>(doc: D): Promise<V2Value<D>> => {
  const stored = await getStore().get<V2Value<D>>(v2Key(doc, "published"));
  if (stored) return stored;
  const built = await migrated();
  return (doc === "catalogue" ? built.catalogue : doc === "buffet" ? built.buffet : built.configs[doc as MenuVenue]) as V2Value<D>;
};
const v2Draft = async <D extends V2Doc>(doc: D): Promise<V2Value<D>> => (await getStore().get<V2Value<D>>(v2Key(doc, "draft"))) ?? (await v2Published(doc));

/** The customer shaped menu for a venue in the v2 model (draft uses the draft catalogue). */
const v2View = async (venue: Venue, state: State): Promise<MenuDoc> => {
  const catalogue = state === "draft" ? await v2Draft("catalogue") : await v2Published("catalogue");
  if (venue === "buffet") return renderBuffet(catalogue, state === "draft" ? await v2Draft("buffet") : await v2Published("buffet"));
  return renderMenu(catalogue, state === "draft" ? await v2Draft(venue) : await v2Published(venue));
};

/** Problems that stop a v2 document being saved (draft) or published. */
const v2Problems = async (doc: V2Doc, value: unknown, against: State): Promise<string[]> => {
  if (doc === "catalogue") return catalogueProblems(value as Catalogue);
  const catalogue = against === "draft" ? await v2Draft("catalogue") : await v2Published("catalogue");
  if (doc === "buffet") {
    const buffetDoc = value as BuffetDoc;
    const known = new Set(catalogue.items.map((item) => item.id));
    const problems = docProblems({ ...(buffetDoc as unknown as MenuDoc), buffet: { ...buffetDoc.buffet, groups: buffetDoc.buffet?.groups?.map((group) => ({ title: group.title, items: group.items })) } }, "buffet");
    for (const group of buffetDoc.buffet?.groups ?? [])
      if (!Array.isArray(group.itemIds) || group.itemIds.length !== group.items.length) problems.push(`Buffet: ${group.title} is not valid.`);
      else for (const id of group.itemIds) if (!known.has(id)) problems.push(`Buffet: a dish in ${group.title} is not in the ${against === "draft" ? "" : "published "}master items.${against === "draft" ? "" : " Publish the master items first."}`);
    return problems;
  }
  const config = value as MenuConfig;
  const problems = configProblems(config, doc as MenuVenue, catalogue);
  if (problems.length) return problems;
  return docProblems(renderMenu(catalogue, config, true), doc);
};

// ---------- shared ----------

const asVenue = (value: string | null): Venue | null => ((VENUES as string[]).includes(value ?? "") ? (value as Venue) : null);

/** Removes internal fields and anything that is not live before a document goes to customers. */
const forCustomers = (doc: MenuDoc): MenuDoc => ({
  ...doc,
  categories: doc.categories
    .map((category) =>
      category.kind === "items" ? { ...category, items: category.items.filter((item) => !item.hidden) } : { ...category, deals: category.deals.filter((deal) => !deal.hidden) },
    )
    .filter((category) => (category.kind === "items" ? category.items.length : category.deals.length) > 0),
  offers: liveOffers(doc).map((offer) => ({ ...offer, source: "" })),
  updatedBy: undefined,
});

const customerDoc = async (venue: Venue, state: State): Promise<MenuDoc> =>
  forCustomers(menuModel() === "v2" ? await v2View(venue, state) : state === "draft" ? await draft(venue) : await published(venue));

const isAdmin = (req: IncomingMessage): boolean => currentSession(req)?.role === "admin";

// ---------- public ----------

// Prices and offers must never linger after an admin switches them off. Browsers always check with
// the server (they also honour stale-while-revalidate, so it must not reach them). Only Vercel's edge
// keeps a shared copy, through Vercel-CDN-Cache-Control, which Vercel strips before the response
// leaves its network: at most 30 s, plus 30 s while it refreshes.
const setPublicCache = (res: ServerResponse) => {
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.setHeader("Vercel-CDN-Cache-Control", "max-age=30, stale-while-revalidate=30");
};

/** GET /api/menu?name=delivery|restaurant|bar|buffet (add &draft=1 as a signed in admin to preview). */
export async function publicMenu(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") return json(res, 405, { error: "Use GET." });
  const url = new URL(req.url ?? "/", "http://local");
  const venue = asVenue(url.searchParams.get("name"));
  if (!venue) return json(res, 404, { error: "Unknown menu." });
  const preview = url.searchParams.get("draft") === "1";
  if (preview && !isAdmin(req)) return json(res, 401, { error: "Previews are for signed in admins." });
  try {
    const doc = await customerDoc(venue, preview ? "draft" : "published");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    if (preview) res.setHeader("Cache-Control", "private, no-store");
    else setPublicCache(res);
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.end(JSON.stringify(doc));
  } catch {
    return json(res, 500, { error: "The menu could not be opened." });
  }
}

/** GET /api/offers: live offers for each venue, for the website's offer sections. */
export async function publicOffers(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") return json(res, 405, { error: "Use GET." });
  try {
    const result: Record<string, unknown> = {};
    for (const venue of VENUES) result[venue] = (await customerDoc(venue, "published")).offers;
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    setPublicCache(res);
    res.end(JSON.stringify(result));
  } catch {
    return json(res, 500, { error: "Offers could not be loaded." });
  }
}

// ---------- admin (role admin only) ----------

/** Venue (legacy and v2) or "catalogue" (v2 only) from ?venue=, after the admin checks. */
const guard = (req: IncomingMessage, res: ServerResponse, method: string): V2Doc | null => {
  if (req.method !== method) return void json(res, 405, { error: `Use ${method}.` }), null;
  if (!isAdmin(req)) return void json(res, 401, { error: "Admins only." }), null;
  if (method !== "GET" && !sameOrigin(req)) return void json(res, 403, { error: "Use the dashboard." }), null;
  const raw = new URL(req.url ?? "/", "http://local").searchParams.get("venue");
  if (raw === "catalogue" && menuModel() === "v2") return "catalogue";
  const venue = asVenue(raw);
  if (!venue) return void json(res, 404, { error: "Unknown menu." }), null;
  return venue;
};

const keyFor = (doc: V2Doc, state: State) => (menuModel() === "v2" ? v2Key(doc, state) : legacyKey(doc as Venue, state));
const publishedFor = async (doc: V2Doc): Promise<{ updated: string }> => (menuModel() === "v2" ? await v2Published(doc) : await published(doc as Venue));

/** GET /api/staff/content?venue=  returns the draft (or published) document for editing.
 *  PUT /api/staff/content?venue=  saves the draft. */
export async function adminContent(req: IncomingMessage, res: ServerResponse) {
  const model = menuModel();
  if (req.method === "PUT") {
    const doc = guard(req, res, "PUT");
    if (!doc) return;
    let value: Record<string, unknown>;
    try {
      value = JSON.parse(await readBody(req, 600_000));
    } catch {
      return json(res, 400, { error: "Invalid document." });
    }
    const problems = model === "v2" ? await v2Problems(doc, value, "draft") : docProblems(value as unknown as MenuDoc, doc as Venue);
    if (problems.length) return json(res, 422, { error: "Please fix these first.", problems });
    const session = currentSession(req)!;
    const saved = { ...value, ...(doc === "catalogue" ? {} : { venue: doc }), updated: new Date().toISOString(), updatedBy: session.user };
    try {
      await getStore().set(keyFor(doc, "draft"), saved);
    } catch (error) {
      return json(res, 503, { error: error instanceof Error ? error.message : "Could not save." });
    }
    return json(res, 200, { ok: true, doc: saved });
  }
  const doc = guard(req, res, "GET");
  if (!doc) return;
  const stored = await getStore().get(keyFor(doc, "draft"));
  const live = await publishedFor(doc);
  return json(res, 200, { model, storage: getStore().kind, hasDraft: Boolean(stored), publishedUpdated: live.updated, doc: stored ?? live });
}

/** POST /api/staff/publish?venue=  makes the draft the published version. */
export async function adminPublish(req: IncomingMessage, res: ServerResponse) {
  const doc = guard(req, res, "POST");
  if (!doc) return;
  const value = await getStore().get<Record<string, unknown>>(keyFor(doc, "draft"));
  if (!value) return json(res, 409, { error: "There is no draft to publish." });
  const problems = menuModel() === "v2" ? await v2Problems(doc, value, "published") : docProblems(value as unknown as MenuDoc, doc as Venue);
  if (problems.length) return json(res, 422, { error: "Please fix these first.", problems });
  try {
    await getStore().set(keyFor(doc, "published"), { ...value, updated: new Date().toISOString() });
    await getStore().del(keyFor(doc, "draft"));
  } catch (error) {
    return json(res, 503, { error: error instanceof Error ? error.message : "Could not publish." });
  }
  return json(res, 200, { ok: true });
}

/** POST /api/staff/discard?venue=  throws the draft away. */
export async function adminDiscard(req: IncomingMessage, res: ServerResponse) {
  const doc = guard(req, res, "POST");
  if (!doc) return;
  await getStore().del(keyFor(doc, "draft"));
  return json(res, 200, { ok: true });
}

export { MENU_VENUES, legacyKey, v2Key, forCustomers, v2View };
