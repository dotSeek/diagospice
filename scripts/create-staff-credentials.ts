// Creates the local .env with random staff portal credentials and keys.
// Existing values are kept, so running it again never locks anyone out.
// Prints only the variable names, never the secrets. .env is git ignored.
// Run with: npm run staff:credentials
import { randomBytes, randomInt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./menu-pdf-kit.ts";

const envPath = join(root, ".env");
const current = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const has = (name: string) => new RegExp(`^${name}=`, "m").test(current);

// 20 characters from an alphabet without look alike characters (no 0/O, 1/l/I).
const password = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 20 }, () => alphabet[randomInt(alphabet.length)]).join("");
};

const wanted: [string, () => string][] = [
  ["ADMIN_USERNAME", () => "admin"],
  ["ADMIN_PASSWORD", password],
  ["STAFF_USERNAME", () => "staff"],
  ["STAFF_PASSWORD", password],
  ["SESSION_SECRET", () => randomBytes(32).toString("base64")],
  ["MENU_FILES_KEY", () => randomBytes(32).toString("base64")],
];

const added = wanted.filter(([name]) => !has(name));
if (added.length === 0) {
  console.log(".env already has every staff portal value. Nothing changed.");
} else {
  const header = current ? "" : "# Diago Spice staff portal. Never commit this file.\n";
  const lines = added.map(([name, make]) => `${name}=${make()}`).join("\n");
  writeFileSync(envPath, `${current}${current && !current.endsWith("\n") ? "\n" : ""}${header}${lines}\n`, { mode: 0o600 });
  console.log(`Wrote to .env: ${added.map(([name]) => name).join(", ")}`);
}
