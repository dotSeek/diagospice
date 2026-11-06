// Builds the two in house A4 menus: the restaurant (dine in) menu and the bar menu.
// Same design as the delivery tri-fold (scripts/menu-pdf-kit.ts), printed as A4 portrait pages.
//
// Inputs (never committed, see private/README.md):
//   private/data/restaurantMenu.ts and private/data/barMenu.ts   dine in prices
//   .env  MENU_FILES_KEY                                          encryption key
// Outputs:
//   private/menus/*.pdf         readable PDFs for the owner (git ignored)
//   private/encrypted/*.enc     AES-256-GCM copies, safe to commit; the staff API
//                               decrypts these for signed in staff only
//
// Run with: npm run menu:dine-in
import { createCipheriv, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buffet, formatPrice } from "../src/data/menu.ts";
import type { DealCategory, ItemCategory } from "../src/data/menu.ts";
import { restaurant } from "../src/data/restaurant.ts";
import { band, block, buffetPage, coverPhoto, deals, facebookQr, htmlDocument, logo, page, renderPdf, root, strip } from "./menu-pdf-kit.ts";

if (!existsSync(join(root, "private", "data", "restaurantMenu.ts"))) {
  console.error("Missing private/data/*.ts. The dine in menu data is kept off git, see private/README.md.");
  process.exit(1);
}
if (existsSync(join(root, ".env"))) process.loadEnvFile(join(root, ".env"));
const keyText = process.env.MENU_FILES_KEY;
if (!keyText) {
  console.error("MENU_FILES_KEY is missing. Run: npm run staff:credentials");
  process.exit(1);
}
const key = Buffer.from(keyText, "base64");
if (key.length !== 32) throw new Error("MENU_FILES_KEY must be 32 bytes, base64 encoded.");

// Loaded by a computed path so type checks and the Vercel build pass without the private data.
const privateData = "../private/data/";
const { restaurantItems, restaurantDeals } = (await import(`${privateData}restaurantMenu.ts`)) as {
  restaurantItems: ItemCategory[];
  restaurantDeals: DealCategory[];
};
const { barItems } = (await import(`${privateData}barMenu.ts`)) as { barItems: ItemCategory[] };

const byId = (list: ItemCategory[], id: string): ItemCategory => {
  const found = list.find((category) => category.id === id);
  if (!found) throw new Error(`Unknown category ${id}`);
  return found;
};
const r = (id: string, cols = 2) => block(byId(restaurantItems, id), cols);
const b = (id: string, cols = 2) => block(byId(barItems, id), cols);

const buffetBand = `<div class="delivery">
  <p class="d-head">Buffet ${buffet.days}</p>
  <p>${buffet.hours}. Adults ${formatPrice(buffet.adultPrice)}, ${buffet.kidsNote.toLowerCase()} ${formatPrice(buffet.kidsPrice)}</p>
  <p class="d-min">For booking call ${buffet.bookingPhone}</p>
</div>`;

const infoRow = `<div class="order">
  <span><small>Call to book</small>${restaurant.phoneDisplay}</span>
  <span><small>Facebook</small>${restaurant.facebookName}</span>
  <span><small>Online</small>${restaurant.websiteDisplay}</span>
</div>`;

const cover = (heading: string, sub: string, chips: string[], image: string, headingSize?: string) => `<div class="page cover"><div class="frame">${coverPhoto(image)}
  <img class="cover-logo" src="${logo}" alt="${restaurant.name} logo">
  <div>
    <p class="script">Welcome to Diago Spice</p>
    <h1 class="gold"${headingSize ? ` style="font-size:${headingSize}"` : ""}>${heading}</h1>
    <p class="sub">${sub}</p>
    <div class="chips">${chips.map((chip) => `<span>${chip}</span>`).join("")}</div>
  </div>
  <div>
    ${buffetBand}
    ${infoRow}
  </div>
</div></div>`;

const backCover = (n: number) =>
  page(
    n,
    `<div class="back-head">
    <img class="back-logo" src="${logo}" alt="${restaurant.name} logo">
    <h1 class="gold" style="font-size:22pt">Thank you for dining with us</h1>
    <p>We hope to see you again soon at ${restaurant.name}.</p>
  </div>
  <div class="rope">✦</div>
  <div class="scan">
    <a class="poster" href="${restaurant.facebookUrl}">
      <i class="star s1"></i><i class="star s2"></i><i class="star s3"></i><i class="star s4"></i>
      <span class="scan-label">FOLLOW US</span>
      <span class="qr-card"><img src="${facebookQr}" alt="Facebook QR code"></span>
    </a>
    <div class="scan-side">
      <p class="manual"><strong>Find us on Facebook</strong>${restaurant.facebookName}</p>
      <p class="manual"><strong>Bookings and enquiries</strong><a href="${restaurant.phoneHref}">${restaurant.phoneDisplay}</a></p>
      <p class="manual"><strong>Visit us</strong>${restaurant.addressLines.join("<br>")}</p>
    </div>
  </div>
  <div class="spacer"></div>
  ${buffetBand}
  <div class="contact-row">
    <div><b>Address</b>${restaurant.addressInline}</div>
    <div><b>Website</b>${restaurant.websiteDisplay}</div>
    <div><b>Phone</b>${restaurant.phoneDisplay}</div>
  </div>`,
  );

const restaurantMenu = htmlDocument(
  `${restaurant.name} Restaurant Menu | ${restaurant.addressInline}`,
  [
    cover("Menu", "Restaurant menu", ["Curries", "Kottu", "Biriyani", "Burgers", "Wings", "Meal deals"], "hero"),
    page(2, `${band("wings", "To begin", "Starters")}${r("starters")}${r("nan")}`),
    page(3, `${band("curry", "Slow cooked", "Mains")}${r("mains")}${r("chips")}`),
    page(4, `${band("biriyani", "House favourites", "Rice and specials")}${r("rice")}${r("specials")}`),
    page(5, `${band("burger", "Stacked high", "Burgers")}${r("burgers", 1)}${r("desserts")}${strip("dessert", "chips", "wings")}`),
    page(6, `${band("chips", "Better together", "Deals")}${restaurantDeals.map(deals).join("")}`),
    buffetPage(7, buffet),
    backCover(8),
  ].join("\n"),
  "A4",
);

const barMenu = htmlDocument(
  `${restaurant.name} Bar Menu | ${restaurant.addressInline}`,
  [
    cover("Bar menu", "Food and soft drinks", ["Soup", "Starters", "Curries", "Burgers", "Soft drinks"], "dining", "60pt"),
    page(2, `${band("wings", "To begin", "Starters and soup")}${b("bar-starters")}${b("bar-soup")}`),
    page(3, `${band("curry", "Served with rice or nan", "Mains")}${b("bar-mains")}${b("bar-nan")}`),
    page(4, `${band("biriyani", "House favourites", "Rice and specials")}${b("bar-rice")}${b("bar-specials")}`),
    page(5, `${band("burger", "Served with chips", "Burgers and chips")}${b("bar-burgers", 1)}${b("bar-chips")}`),
    page(6, `${band("dessert", "Something sweet", "Desserts and drinks")}${b("bar-desserts")}${b("bar-soft-drinks", 1)}${strip("chips", "wings", "biriyani")}`),
    backCover(7),
  ].join("\n"),
  "A4",
);

const plainDir = join(root, "private", "menus");
const encryptedDir = join(root, "private", "encrypted");
mkdirSync(plainDir, { recursive: true });
mkdirSync(encryptedDir, { recursive: true });

/** AES-256-GCM. File layout: 12 byte IV, 16 byte auth tag, then the ciphertext. */
const encrypt = (plain: Buffer): Buffer => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
};

// Menu data for the QR table menus (/restaurant-menu/ and /bar-menu/), encrypted the same way.
// The public menu API decrypts these, so a menu change only needs a rebuild and deploy;
// the printed QR codes keep working because their links never change.
const tableMenus = {
  restaurant: {
    venue: "restaurant",
    title: "Restaurant menu",
    note: "Dine in prices. Please order with our staff.",
    categories: [
      ...["starters", "mains", "rice", "specials", "burgers", "chips", "nan", "desserts"].map((id) => byId(restaurantItems, id)),
      ...restaurantDeals,
    ],
    buffet,
  },
  bar: {
    venue: "bar",
    title: "Bar menu",
    note: "Bar prices. Please order at the bar.",
    categories: ["bar-starters", "bar-soup", "bar-mains", "bar-nan", "bar-rice", "bar-specials", "bar-burgers", "bar-chips", "bar-desserts", "bar-soft-drinks"].map((id) => byId(barItems, id)),
  },
};
for (const [venue, data] of Object.entries(tableMenus)) {
  const json = Buffer.from(JSON.stringify({ ...data, updated: new Date().toISOString().slice(0, 10) }));
  writeFileSync(join(encryptedDir, `${venue}-menu.json.enc`), encrypt(json));
  console.log(`Encrypted private/encrypted/${venue}-menu.json.enc`);
}

// MENU_DATA_ONLY=1 refreshes the table menu data without re-rendering the PDFs.
for (const [name, html] of process.env.MENU_DATA_ONLY ? [] : ([
  ["diago-spice-restaurant-menu", restaurantMenu],
  ["diago-spice-bar-menu", barMenu],
] as const)) {
  const pdfPath = join(plainDir, `${name}.pdf`);
  renderPdf(html, pdfPath, process.env.MENU_PREVIEW ? `${process.env.MENU_PREVIEW}-${name}.html` : undefined);
  writeFileSync(join(encryptedDir, `${name}.pdf.enc`), encrypt(readFileSync(pdfPath)));
  console.log(`Encrypted private/encrypted/${name}.pdf.enc`);
}
