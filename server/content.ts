// Menu and offer storage plus the public and admin endpoints.
//
// Storage, in order of preference:
//   1. Upstash Redis, when UPSTASH_REDIS_REST_URL/TOKEN (or Vercel's KV_REST_API_URL/TOKEN) are set
//   2. Local JSON files in private/store/ during local development (never on Vercel)
//   3. Read only: the built in menus (src/data/menu.ts and private/encrypted/*.json.enc)
//
// Each venue keeps a draft and a published document. Customers only ever get the published
// one, and only offers that pass liveOffers(). Admins edit the draft, preview it, then publish.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { Redis } from "@upstash/redis";
import { VENUES, docProblems, liveOffers, seedOffers } from "../src/data/content.js";
import type { MenuDoc, Venue } from "../src/data/content.js";
import { buffet, menuCategories } from "../src/data/menu.js";
import { currentSession, decryptFile, json, readBody, sameOrigin } from "./staff.js";

type State = "draft" | "published";

interface Store {
  kind: "redis" | "file" | "read-only";
  get(venue: Venue, state: State): Promise<MenuDoc | null>;
  set(venue: Venue, state: State, doc: MenuDoc): Promise<void>;
  del(venue: Venue, state: State): Promise<void>;
}

const key = (venue: Venue, state: State) => `diago:menu:${venue}:${state}`;

const createStore = (): Store => {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) {
    const redis = new Redis({ url, token });
    return {
      kind: "redis",
      get: (venue, state) => redis.get<MenuDoc>(key(venue, state)),
      set: async (venue, state, doc) => void (await redis.set(key(venue, state), doc)),
      del: async (venue, state) => void (await redis.del(key(venue, state))),
    };
  }
  if (!process.env.VERCEL) {
    const dir = join(process.cwd(), "private", "store");
    const file = (venue: Venue, state: State) => join(dir, `${venue}-${state}.json`);
    return {
      kind: "file",
      get: async (venue, state) => (existsSync(file(venue, state)) ? (JSON.parse(readFileSync(file(venue, state), "utf8")) as MenuDoc) : null),
      set: async (venue, state, doc) => {
        mkdirSync(dir, { recursive: true });
        writeFileSync(file(venue, state), JSON.stringify(doc, null, 2));
      },
      del: async (venue, state) => rmSync(file(venue, state), { force: true }),
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
const getStore = (): Store => (store ??= createStore());

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

const asVenue = (value: string | null): Venue | null => (VENUES as string[]).includes(value ?? "") ? (value as Venue) : null;

export const published = async (venue: Venue): Promise<MenuDoc> => (await getStore().get(venue, "published")) ?? seed(venue);
const draft = async (venue: Venue): Promise<MenuDoc> => (await getStore().get(venue, "draft")) ?? (await published(venue));

/** Removes internal fields and anything that is not live before a document goes to customers. */
const forCustomers = (doc: MenuDoc): MenuDoc => ({
  ...doc,
  offers: liveOffers(doc).map((offer) => ({ ...offer, source: "" })),
  updatedBy: undefined,
});

const isAdmin = (req: IncomingMessage): boolean => currentSession(req)?.role === "admin";

// ---------- public ----------

/** GET /api/menu?name=delivery|restaurant|bar (add &draft=1 as a signed in admin to preview). */
export async function publicMenu(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") return json(res, 405, { error: "Use GET." });
  const url = new URL(req.url ?? "/", "http://local");
  const venue = asVenue(url.searchParams.get("name"));
  if (!venue) return json(res, 404, { error: "Unknown menu." });
  const preview = url.searchParams.get("draft") === "1";
  if (preview && !isAdmin(req)) return json(res, 401, { error: "Previews are for signed in admins." });
  try {
    const doc = forCustomers(preview ? await draft(venue) : await published(venue));
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", preview ? "private, no-store" : "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.end(JSON.stringify(doc));
  } catch {
    return json(res, 500, { error: "The menu could not be opened." });
  }
}

/** GET /api/offers: live offers for each venue, for the website's Grand Opening section. */
export async function publicOffers(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") return json(res, 405, { error: "Use GET." });
  try {
    const result: Record<string, unknown> = {};
    for (const venue of VENUES) result[venue] = forCustomers(await published(venue)).offers;
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    res.end(JSON.stringify(result));
  } catch {
    return json(res, 500, { error: "Offers could not be loaded." });
  }
}

// ---------- admin (role admin only) ----------

const guard = (req: IncomingMessage, res: ServerResponse, method: string): Venue | null => {
  if (req.method !== method) return void json(res, 405, { error: `Use ${method}.` }), null;
  if (!isAdmin(req)) return void json(res, 401, { error: "Admins only." }), null;
  if (method !== "GET" && !sameOrigin(req)) return void json(res, 403, { error: "Use the dashboard." }), null;
  const venue = asVenue(new URL(req.url ?? "/", "http://local").searchParams.get("venue"));
  if (!venue) return void json(res, 404, { error: "Unknown menu." }), null;
  return venue;
};

/** GET /api/staff/content?venue=  returns the draft (or published) document for editing.
 *  PUT /api/staff/content?venue=  saves the draft. */
export async function adminContent(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "PUT") {
    const venue = guard(req, res, "PUT");
    if (!venue) return;
    let doc: MenuDoc;
    try {
      doc = JSON.parse(await readBody(req, 300_000)) as MenuDoc;
    } catch {
      return json(res, 400, { error: "Invalid document." });
    }
    const problems = docProblems(doc, venue);
    if (problems.length) return json(res, 422, { error: "Please fix these first.", problems });
    const session = currentSession(req)!;
    const saved: MenuDoc = { ...doc, venue, updated: new Date().toISOString(), updatedBy: session.user };
    try {
      await getStore().set(venue, "draft", saved);
    } catch (error) {
      return json(res, 503, { error: error instanceof Error ? error.message : "Could not save." });
    }
    return json(res, 200, { ok: true, doc: saved });
  }
  const venue = guard(req, res, "GET");
  if (!venue) return;
  const hasDraft = Boolean(await getStore().get(venue, "draft"));
  const live = await published(venue);
  return json(res, 200, { storage: getStore().kind, hasDraft, publishedUpdated: live.updated, doc: hasDraft ? await draft(venue) : live });
}

/** POST /api/staff/publish?venue=  makes the draft the published menu. */
export async function adminPublish(req: IncomingMessage, res: ServerResponse) {
  const venue = guard(req, res, "POST");
  if (!venue) return;
  const doc = await getStore().get(venue, "draft");
  if (!doc) return json(res, 409, { error: "There is no draft to publish." });
  const problems = docProblems(doc, venue);
  if (problems.length) return json(res, 422, { error: "Please fix these first.", problems });
  try {
    await getStore().set(venue, "published", { ...doc, updated: new Date().toISOString() });
    await getStore().del(venue, "draft");
  } catch (error) {
    return json(res, 503, { error: error instanceof Error ? error.message : "Could not publish." });
  }
  return json(res, 200, { ok: true });
}

/** POST /api/staff/discard?venue=  throws the draft away. */
export async function adminDiscard(req: IncomingMessage, res: ServerResponse) {
  const venue = guard(req, res, "POST");
  if (!venue) return;
  await getStore().del(venue, "draft");
  return json(res, 200, { ok: true });
}
