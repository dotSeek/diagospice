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
import { ALWAYS_ON, AVAILABLE } from "./dine-in-available.ts";
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

// Availability: rows not on the available list are marked hidden. The QR menus drop hidden rows
// (and empty sections) for customers, admins still see them, and the printed menus leave them out.
const available = (name: string, categoryId: string) => !AVAILABLE || ALWAYS_ON.has(categoryId) || AVAILABLE.has(name);
const markItems = (list: ItemCategory[]): ItemCategory[] =>
  list.map((category) => ({ ...category, items: category.items.map((item) => (available(item.name, category.id) ? item : { ...item, hidden: true })) }));
const markDeals = (list: DealCategory[]): DealCategory[] =>
  list.map((category) => ({ ...category, deals: category.deals.map((deal) => (available(deal.name, category.id) ? deal : { ...deal, hidden: true })) }));
const restaurantRows = markItems(restaurantItems);
const restaurantDealRows = markDeals(restaurantDeals);
const barRows = markItems(barItems);
if (AVAILABLE) {
  const names = new Set([...restaurantItems, ...barItems].flatMap((category) => category.items.map((item) => item.name)));
  const unknown = [...AVAILABLE].filter((name) => !names.has(name));
  if (unknown.length) throw new Error(`Not on the dine in menus: ${unknown.join(", ")}`);
}

const byId = (list: ItemCategory[], id: string): ItemCategory => {
  const found = list.find((category) => category.id === id);
  if (!found) throw new Error(`Unknown category ${id}`);
  return found;
};
const shown = (category: ItemCategory): ItemCategory => ({ ...category, items: category.items.filter((item) => !item.hidden) });
const has = (list: ItemCategory[], id: string) => shown(byId(list, id)).items.length > 0;
const printed = (list: ItemCategory[], id: string, cols = 2) => (has(list, id) ? block(shown(byId(list, id)), cols) : "");
const r = (id: string, cols = 2) => printed(restaurantRows, id, cols);
const b = (id: string, cols = 2) => printed(barRows, id, cols);
const printedDeals = restaurantDealRows.map((category) => ({ ...category, deals: category.deals.filter((deal) => !deal.hidden) })).filter((category) => category.deals.length);
/** Numbers the pages that have content, in order. */
const pages = (bodies: (string | ((n: number) => string) | null)[]) =>
  bodies.filter((body) => body !== null).map((body, i) => (typeof body === "function" ? body(i + 2) : page(i + 2, body!)));

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

// Full menus keep the original page plan. With an availability list the shorter menus are
// packed onto fewer pages, and the cover chips name only dishes that are on.
const restaurantPages = AVAILABLE
  ? [
      `${band("curry", "To begin", "Starters and mains")}${r("starters")}${r("mains")}${r("nan")}`,
      `${band("biriyani", "House favourites", "Rice and specials")}${r("rice")}${r("specials")}${r("chips")}${r("desserts")}`,
      printedDeals.length ? `${band("chips", "Better together", "Deals")}${printedDeals.map(deals).join("")}` : null,
    ]
  : [
      `${band("wings", "To begin", "Starters")}${r("starters")}${r("nan")}`,
      `${band("curry", "Slow cooked", "Mains")}${r("mains")}${r("chips")}`,
      `${band("biriyani", "House favourites", "Rice and specials")}${r("rice")}${r("specials")}`,
      `${band("burger", "Stacked high", "Burgers")}${r("burgers", 1)}${r("desserts")}${strip("dessert", "chips", "wings")}`,
      `${band("chips", "Better together", "Deals")}${printedDeals.map(deals).join("")}`,
    ];
const barPages = AVAILABLE
  ? [
      `${band("curry", "Served with rice or nan", "Starters and mains")}${b("bar-starters")}${b("bar-soup")}${b("bar-mains")}${b("bar-nan")}`,
      `${band("biriyani", "House favourites", "Rice and specials")}${b("bar-rice")}${b("bar-specials")}${b("bar-burgers", 1)}${b("bar-chips")}`,
      `${band("dessert", "Something sweet", "Desserts and drinks")}${b("bar-desserts")}${b("bar-soft-drinks", 1)}${strip("chips", "wings", "biriyani")}`,
    ]
  : [
      `${band("wings", "To begin", "Starters and soup")}${b("bar-starters")}${b("bar-soup")}`,
      `${band("curry", "Served with rice or nan", "Mains")}${b("bar-mains")}${b("bar-nan")}`,
      `${band("biriyani", "House favourites", "Rice and specials")}${b("bar-rice")}${b("bar-specials")}`,
      `${band("burger", "Served with chips", "Burgers and chips")}${b("bar-burgers", 1)}${b("bar-chips")}`,
      `${band("dessert", "Something sweet", "Desserts and drinks")}${b("bar-desserts")}${b("bar-soft-drinks", 1)}${strip("chips", "wings", "biriyani")}`,
    ];

const restaurantMenu = htmlDocument(
  `${restaurant.name} Restaurant Menu | ${restaurant.addressInline}`,
  [
    cover("Menu", "Restaurant menu", AVAILABLE ? ["Curries", "Kottu", "Biriyani", "Fried rice", "Chips"] : ["Curries", "Kottu", "Biriyani", "Burgers", "Wings", "Meal deals"], "hero"),
    ...pages([...restaurantPages, (n) => buffetPage(n, buffet), (n) => backCover(n)]),
  ].join("\n"),
  "A4",
);

const barMenu = htmlDocument(
  `${restaurant.name} Bar Menu | ${restaurant.addressInline}`,
  [
    cover("Bar menu", "Food and soft drinks", AVAILABLE ? ["Starters", "Curries", "Kottu", "Biriyani", "Soft drinks"] : ["Soup", "Starters", "Curries", "Burgers", "Soft drinks"], "dining", "60pt"),
    ...pages([...barPages, (n) => backCover(n)]),
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
      ...["starters", "mains", "rice", "specials", "burgers", "chips", "nan", "desserts"].map((id) => byId(restaurantRows, id)),
      ...restaurantDealRows,
    ],
    buffet,
  },
  bar: {
    venue: "bar",
    title: "Bar menu",
    note: "Bar prices. Please order at the bar.",
    categories: ["bar-starters", "bar-soup", "bar-mains", "bar-nan", "bar-rice", "bar-specials", "bar-burgers", "bar-chips", "bar-desserts", "bar-soft-drinks"].map((id) => byId(barRows, id)),
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
