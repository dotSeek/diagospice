// Staff portal backend: sign in, sign out, session check and the protected in house
// menu PDFs. Plain Node (IncomingMessage, ServerResponse), so the same code runs as
// Vercel functions (api/staff/*.ts) and inside the Vite dev and preview servers.
//
// Security:
//  - Credentials come only from environment variables (local .env, Vercel settings).
//  - Passwords are compared in constant time through HMAC digests.
//  - The session is an HMAC signed cookie: HttpOnly, SameSite=Strict, Secure on https, 8 hours.
//  - Sign in needs a same origin JSON POST, and repeated failures lock that address for 15 minutes.
//  - PDFs are stored AES-256-GCM encrypted (private/encrypted) and decrypted per request,
//    only for a valid session, with no-store caching.
import { createDecipheriv, createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";

type Role = "admin" | "staff";
interface Session {
  user: string;
  role: Role;
  exp: number;
}

const COOKIE = "diago_staff";
const SESSION_SECONDS = 8 * 60 * 60;
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

export const MENUS = {
  restaurant: { file: "diago-spice-restaurant-menu.pdf", download: "Diago-Spice-Restaurant-Menu.pdf" },
  bar: { file: "diago-spice-bar-menu.pdf", download: "Diago-Spice-Bar-Menu.pdf" },
} as const;
type MenuName = keyof typeof MENUS;

const env = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Staff portal is not configured: ${name} is missing.`);
  return value;
};

const hmac = (value: string): Buffer => createHmac("sha256", env("SESSION_SECRET")).update(value).digest();
const sameSecret = (a: string, b: string): boolean => timingSafeEqual(hmac(a), hmac(b));

const accounts = (): { user: string; password: string; role: Role }[] => [
  { user: env("ADMIN_USERNAME"), password: env("ADMIN_PASSWORD"), role: "admin" },
  { user: env("STAFF_USERNAME"), password: env("STAFF_PASSWORD"), role: "staff" },
];

const sign = (session: Session): string => {
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${body}.${hmac(body).toString("base64url")}`;
};

const verify = (token: string | undefined): Session | null => {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = hmac(body);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    return session.exp > Date.now() / 1000 ? session : null;
  } catch {
    return null;
  }
};

const cookies = (req: IncomingMessage): Record<string, string> =>
  Object.fromEntries(
    (req.headers.cookie ?? "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([name, value]) => name && value)
      .map(([name, value]) => [name, decodeURIComponent(value)]),
  );

const isHttps = (req: IncomingMessage): boolean =>
  req.headers["x-forwarded-proto"] === "https" || Boolean((req.socket as { encrypted?: boolean }).encrypted);

const setCookie = (req: IncomingMessage, res: ServerResponse, value: string, maxAge: number) => {
  const parts = [`${COOKIE}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${maxAge}`];
  if (isHttps(req)) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
};

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.end(JSON.stringify(body));
};

const readBody = async (req: IncomingMessage): Promise<string> => {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 4096) throw new Error("Body too large");
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const clientIp = (req: IncomingMessage): string =>
  String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() || req.socket.remoteAddress || "unknown";

const sameOrigin = (req: IncomingMessage): boolean => {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
};

// Per instance memory. Serverless instances are short lived, so this slows guessing rather
// than stopping it; the long random passwords are the real protection.
const failures = new Map<string, { count: number; until: number }>();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const currentSession = (req: IncomingMessage): Session | null => verify(cookies(req)[COOKIE]);

export async function login(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return json(res, 405, { error: "Use POST." });
  if (!sameOrigin(req)) return json(res, 403, { error: "Sign in from the staff page." });
  if (!String(req.headers["content-type"]).startsWith("application/json")) return json(res, 415, { error: "Send JSON." });

  const ip = clientIp(req);
  const record = failures.get(ip);
  if (record && record.until > Date.now()) return json(res, 429, { error: "Too many attempts. Try again in 15 minutes." });

  let username = "";
  let password = "";
  try {
    const parsed = JSON.parse(await readBody(req)) as { username?: unknown; password?: unknown };
    username = typeof parsed.username === "string" ? parsed.username.trim() : "";
    password = typeof parsed.password === "string" ? parsed.password : "";
  } catch {
    return json(res, 400, { error: "Invalid request." });
  }

  // Check every account so the time taken does not reveal which usernames exist.
  let match: { user: string; role: Role } | null = null;
  for (const account of accounts()) {
    const ok = sameSecret(username, account.user) && sameSecret(password, account.password);
    if (ok) match = account;
  }

  if (!match) {
    const count = (record?.count ?? 0) + 1;
    failures.set(ip, { count, until: count >= MAX_FAILURES ? Date.now() + LOCK_MS : 0 });
    await sleep(600);
    return json(res, 401, { error: "Wrong username or password." });
  }

  failures.delete(ip);
  const session: Session = { user: match.user, role: match.role, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS };
  setCookie(req, res, sign(session), SESSION_SECONDS);
  return json(res, 200, { user: session.user, role: session.role });
}

export function logout(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return json(res, 405, { error: "Use POST." });
  setCookie(req, res, "", 0);
  return json(res, 200, { ok: true });
}

export function session(req: IncomingMessage, res: ServerResponse) {
  const current = currentSession(req);
  if (!current) return json(res, 401, { error: "Not signed in." });
  return json(res, 200, { user: current.user, role: current.role });
}

const decryptMenu = (name: MenuName): Buffer => {
  const data = readFileSync(join(process.cwd(), "private", "encrypted", `${MENUS[name].file}.enc`));
  const key = Buffer.from(env("MENU_FILES_KEY"), "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]);
};

export function menu(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") return json(res, 405, { error: "Use GET." });
  if (!currentSession(req)) return json(res, 401, { error: "Not signed in." });
  const url = new URL(req.url ?? "/", "http://local");
  const name = url.searchParams.get("name");
  if (name !== "restaurant" && name !== "bar") return json(res, 404, { error: "Unknown menu." });

  let pdf: Buffer;
  try {
    pdf = decryptMenu(name);
  } catch {
    return json(res, 500, { error: "The menu file could not be opened. Check MENU_FILES_KEY." });
  }
  const disposition = url.searchParams.get("download") === "1" ? "attachment" : "inline";
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", String(pdf.length));
  res.setHeader("Content-Disposition", `${disposition}; filename="${MENUS[name].download}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(pdf);
}

/** Routes /api/staff/<action> for the Vite dev and preview servers. */
export async function route(req: IncomingMessage, res: ServerResponse, action: string) {
  try {
    if (action === "login") return await login(req, res);
    if (action === "logout") return logout(req, res);
    if (action === "session") return session(req, res);
    if (action === "menu") return menu(req, res);
    return json(res, 404, { error: "Not found." });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Server error." });
  }
}
