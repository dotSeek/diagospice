// A4 tri-fold restaurant and grand opening leaflet, print ready (docs/diago-trifold-print-specification.md).
//
// Page: 303 x 216 mm = A4 landscape 297 x 210 mm trim + 3 mm bleed on every edge.
// Roll fold, finished size about 99 x 210 mm (DL). Panel widths 97 / 100 / 100 mm:
//   side 1, outside:  [P5 Delivery and bar, folds in, 97] [P6 Back cover, 100] [P1 Front cover, 100]
//   side 2, inside:   [P2 Introduction, 100] [P3 Dine in, 100] [P4 Menu highlights, 97]
// Print double sided, flip on the short edge, fold P4 in first, then fold P1 over.
//
// Uses only confirmed information: website copy, the restaurant (dine in) menu document and
// offers an admin has published (read from the live menu API, LEAFLET_SOURCE). Unpublished,
// unconfirmed or expired offers never print.
//
// Outputs (git ignored, they show dine in prices):
//   private/print/diago-spice-promo-leaflet.pdf             print file, TrimBox and BleedBox set
//   private/print/diago-spice-promo-leaflet.html            editable source (open in a browser)
//   private/print/diago-spice-promo-leaflet-fold-proof.pdf  panel order and folding proof
// Run with: npm run leaflet
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import { buffet, delivery, formatPrice } from "../src/data/menu.ts";
import type { DealCategory, ItemCategory, MenuItemData } from "../src/data/menu.ts";
import type { MenuDoc, Offer, Venue } from "../src/data/content.ts";
import { restaurant } from "../src/data/restaurant.ts";
import { dataUri, escapeHtml, htmlDocument, logo, photoLayer, renderPdf, renderPng, root } from "./menu-pdf-kit.ts";

if (!existsSync(join(root, "private", "data", "restaurantMenu.ts"))) {
  console.error("Missing private/data/*.ts (dine in prices). See private/README.md.");
  process.exit(1);
}
const privateData = "../private/data/";
const { restaurantItems, restaurantDeals } = (await import(`${privateData}restaurantMenu.ts`)) as {
  restaurantItems: ItemCategory[];
  restaurantDeals: DealCategory[];
};

const outDir = join(root, "private", "print");
mkdirSync(outDir, { recursive: true });

// Published menus and live offers, exactly as customers see them. Default: the live site.
const source = process.env.LEAFLET_SOURCE ?? restaurant.websiteUrl;
const publishedDoc = async (venue: Venue): Promise<MenuDoc | null> => {
  try {
    const res = await fetch(`${source}/api/menu?name=${venue}`);
    return res.ok ? ((await res.json()) as MenuDoc) : null;
  } catch {
    return null;
  }
};
const [deliveryDoc, restaurantDoc, barDoc] = await Promise.all([publishedDoc("delivery"), publishedDoc("restaurant"), publishedDoc("bar")]);
console.log(`Menu source: ${source} (${[deliveryDoc, restaurantDoc, barDoc].filter(Boolean).length}/3 published menus loaded, missing ones use the built in menu)`);
const dineInOffers: Offer[] = restaurantDoc?.offers ?? [];
const deliveryOffers: Offer[] = deliveryDoc?.offers ?? [];
const barOffers: Offer[] = barDoc?.offers ?? [];

// ---------- confirmed data ----------
const dineInCategories = (): ItemCategory[] =>
  (restaurantDoc?.categories.filter((category) => category.kind === "items") as ItemCategory[] | undefined) ?? restaurantItems;
const findItem = (name: string): MenuItemData => {
  for (const category of dineInCategories()) {
    const item = category.items.find((entry) => entry.name === name);
    if (item) return item;
  }
  throw new Error(`Not on the restaurant menu: ${name}`);
};
// Signature dishes, at dine in prices from the restaurant menu document.
const highlights = [
  "Kottu",
  "Dum Parota",
  "Chicken Dum Biriyani",
  "Mutton Dum Biriyani",
  "Diago Special Beef Stew",
  "Butter Chicken",
  "Chicken Tikka Masala",
  "Pad Thai",
  "Honey BBQ Chicken Bites",
  "Mixed Doner Kebab",
].map(findItem);



const qr = async (url: string): Promise<string> => {
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#1a1411", light: "#ffffff" } });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};
const restaurantMenuUrl = `${restaurant.websiteUrl}/restaurant-menu/`;
const barMenuUrl = `${restaurant.websiteUrl}/bar-menu/`;
const qrRestaurant = await qr(restaurantMenuUrl);
const qrBar = await qr(barMenuUrl);
const qrWhatsApp = await qr(restaurant.whatsappUrl);
const qrSite = await qr(restaurant.websiteUrl);

// ---------- building blocks ----------
const title = (text: string): string => `<h2 class="title"><i class="dia"></i><span>${escapeHtml(text)}</span><i class="dia"></i></h2>`;

const row = (item: MenuItemData): string =>
  `<li class="item"><div class="line"><span class="name">${escapeHtml(item.name)}</span><span class="dots"></span><span class="price">${formatPrice(item.price)}</span></div>${item.note ? `<span class="note">${escapeHtml(item.note)}</span>` : ""}</li>`;

const offerBox = (offer: Offer, badge: string): string =>
  `<article class="offer"><span class="badge">${badge}</span><h3>${escapeHtml(offer.title)}</h3><p class="offer-value">${escapeHtml(offer.value)}</p><p>${escapeHtml(offer.description)}</p>${
    offer.items.length
      ? `<ul class="list">${offer.items
          .map((item) => `<li class="item"><div class="line"><span class="name">${escapeHtml(item.name)}</span><span class="dots"></span><span class="price"><s>${formatPrice(item.originalPrice)}</s> ${formatPrice(item.offerPrice)}</span></div></li>`)
          .join("")}</ul>`
      : ""
  }<ul class="conds">${offer.conditions.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}${offer.expires ? `<li>Ends ${escapeHtml(offer.expires)}</li>` : ""}</ul></article>`;

const qrTile = (src: string, label: string, url: string, size = "30mm"): string =>
  `<figure class="qrt" style="width:${size}"><span class="qrt-card"><img src="${src}" alt="QR code: ${escapeHtml(label)}"></span><figcaption><b>${escapeHtml(label)}</b>${escapeHtml(url.replace("https://", ""))}</figcaption></figure>`;

const photoStrip = (...names: string[]): string =>
  `<div class="pstrip">${names.map((name) => `<div>${photoLayer(name, "linear-gradient(transparent,transparent)")}</div>`).join("")}</div>`;

const panel = (cls: string, body: string): string => `<section class="panel ${cls}"><div class="frame"><main>${body}</main></div></section>`;

// ---------- panels ----------
const p1Cover = `<section class="panel cover"><div class="frame">${photoLayer("hero", "linear-gradient(180deg,rgba(17,13,11,.85) 0%,rgba(17,13,11,.35) 30%,rgba(17,13,11,.5) 55%,rgba(17,13,11,.97) 80%)")}
  <img class="cover-logo" src="${logo}" alt="${restaurant.name} logo">
  <div>
    <p class="resto">Resto Bar</p>
    <p class="script">Grand Opening</p>
    <h1 class="gold">Diago Spice</h1>
    <p class="sub">Desi Spice. Western Soul. Big Flavours!</p>
  </div>
  <div class="cover-high">
    ${dineInOffers.length ? `<p class="ch-head">${escapeHtml(dineInOffers[0].title)}</p><p>${escapeHtml(dineInOffers[0].value)}</p><p class="ch-note">Dine in only</p>` : `<p class="ch-head">Weekend buffet</p><p>${buffet.days}, ${buffet.hours}</p><p class="ch-price"><b>${formatPrice(buffet.adultPrice)}</b> adults <b>${formatPrice(buffet.kidsPrice)}</b> ${buffet.kidsNote.toLowerCase()}</p>`}
  </div>
</div></section>`;

const p2Intro = panel(
  "intro",
  `<div class="photo-band">${photoLayer("dining", "linear-gradient(180deg,rgba(17,13,11,.1),rgba(17,13,11,.9))")}<p class="script">Welcome to Diago Spice</p></div>
  <div class="stack">
    <div>
      <h2 class="lead gold">Where Indian Spice Meets the Wild West!</h2>
      <p class="body">Pull up a chair on Pengwern Road, Clase, for sizzling kottu, dum biryani, rich curries, juicy burgers and fiery wings.</p>
    </div>
    ${photoStrip("wings", "burger", "dessert")}
    <div class="notes">
      <p><b>The food</b>Diago special foods sit at the heart of it: kottu, dum parota and our special beef stew, alongside curries, biriyani, burgers and wings.</p>
      <p><b>The look</b>Our style tips its hat to the American cowboy era of 1865 to 1895, with a little frontier swagger on every plate.</p>
      <p><b>The dining</b>Order from the full menu, pick a meal deal, or come hungry for the buffet from Friday to Sunday.</p>
    </div>
    <div class="visit">
      ${title("Visit us")}
      <p>${restaurant.addressLines.join("<br>")}</p>
      <p class="phone">${restaurant.phoneDisplay}</p>
    </div>
  </div>`,
);

const p3DineIn = panel(
  "dine",
  `<div class="photo-band">${photoLayer("curry", "linear-gradient(180deg,rgba(17,13,11,.1),rgba(17,13,11,.9))")}<p class="script">Dine at Diago</p><h2 class="band-h gold">Dine in</h2></div>
  <div class="stack">
    ${dineInOffers.length ? `<div>${title("Grand opening offers")}${dineInOffers.map((offer) => offerBox(offer, "Dine in only")).join("")}</div>` : ""}
    ${((restaurantDoc?.categories.filter((category) => category.kind === "deals") as DealCategory[] | undefined) ?? restaurantDeals)
      .map(
        (category) =>
          `<div>${title(category.label)}<div class="deals">${category.deals
            .map((deal) => `<article class="deal"><h3>${escapeHtml(deal.name)}</h3><p>${escapeHtml(deal.includes.join(", "))}</p><b>${formatPrice(deal.price)}</b></article>`)
            .join("")}</div></div>`,
      )
      .join("")}
    <div class="buffet-box"><p class="bb-head">Weekend buffet</p><p>${buffet.days}, ${buffet.hours}</p><p class="bb-prices"><b>${formatPrice(buffet.adultPrice)}</b> adults <b>${formatPrice(buffet.kidsPrice)}</b> ${buffet.kidsNote.toLowerCase()}</p><p>For booking call ${buffet.bookingPhone}</p></div>
    <p class="fine">Dine in prices. Restaurant offers are not available on delivery orders or bar drinks.</p>
  </div>`,
);

const p4Highlights = panel(
  "high",
  `<div class="photo-band">${photoLayer("biriyani", "linear-gradient(180deg,rgba(17,13,11,.1),rgba(17,13,11,.9))")}<p class="script">House favourites</p><h2 class="band-h gold">Signature dishes</h2></div>
  <div class="stack">
    <ul class="list">${highlights.map(row).join("")}</ul>
    ${photoStrip("curry", "chips")}
    <div class="qr-row">${qrTile(qrRestaurant, "Full restaurant menu", restaurantMenuUrl, "36mm")}<p class="qr-note">Scan for the full dine in menu with all prices and any restaurant offers.</p></div>
  </div>`,
);

const p5DeliveryBar = panel(
  "split",
  `<div class="half">
    <div class="photo-band sm">${photoLayer("burger", "linear-gradient(180deg,rgba(17,13,11,.1),rgba(17,13,11,.9))")}<p class="script">Order in</p><h2 class="band-h gold">Delivery</h2></div>
    ${deliveryOffers.map((offer) => offerBox(offer, "Delivery only")).join("")}
    <ul class="terms-list">
      <li><b>Free delivery</b> within 3 miles</li>
      <li><b>£2 delivery charge</b> beyond 3 miles</li>
      <li><b>Minimum order ${escapeHtml(delivery.minimumOrder)}</b> depending on location</li>
    </ul>
    <div class="qr-row">${qrTile(qrWhatsApp, "Order on WhatsApp", restaurant.phoneDisplay, "31mm")}<p class="qr-note">Scan to start your order on WhatsApp, or call ${restaurant.phoneDisplay}.</p></div>
  </div>
  <div class="divider"></div>
  <div class="half">
    <div class="photo-band sm">${photoLayer("bar", "linear-gradient(180deg,rgba(17,13,11,.1),rgba(17,13,11,.9))")}<p class="script">Pull up a stool</p><h2 class="band-h gold">The bar</h2></div>
    <p class="body">Food and soft drinks served at the bar, with mains served with rice or nan and burgers with chips.</p>
    ${barOffers.map((offer) => offerBox(offer, "Bar only")).join("")}
    <div class="qr-row">${qrTile(qrBar, "Bar menu", barMenuUrl, "31mm")}<p class="qr-note">Scan for the full bar menu and any bar offers. Please order at the bar.</p></div>
  </div>`,
);

const p6Back = panel(
  "back",
  `<div class="back-top">
    <img class="back-logo" src="${logo}" alt="${restaurant.name} logo">
    <p class="resto">Resto Bar</p>
    <h2 class="gold back-h">Visit us or order online</h2>
  </div>
  <dl class="facts">
    <div><dt>Address</dt><dd>${restaurant.addressInline}</dd></div>
    <div><dt>Weekend buffet</dt><dd>${buffet.days}<br>${buffet.hours}</dd></div>
    <div><dt>Call or WhatsApp</dt><dd>${restaurant.phoneDisplay}</dd></div>
    <div><dt>Website</dt><dd>${restaurant.websiteDisplay}</dd></div>
    <div><dt>Facebook</dt><dd>${restaurant.facebookName}</dd></div>
  </dl>
  <div class="qr-pair">${qrTile(qrSite, "Website", restaurant.websiteUrl, "34mm")}${qrTile(qrWhatsApp, "Order on WhatsApp", restaurant.phoneDisplay, "34mm")}</div>
  <p class="brand">Desi Spice. Western Soul. Big Flavours!</p>`,
);

// ---------- styles ----------
const css = `
.sheet{position:relative;width:303mm;height:216mm;overflow:hidden;page-break-after:always;background:radial-gradient(170mm 100mm at 50% 0%,rgba(240,168,58,.12),transparent 70%),#1a1411}
.sheet:last-child{page-break-after:auto}
/* panel boxes sit on the trim grid; 3 mm bleed around the outside */
.panel{position:absolute;top:3mm;height:210mm;padding:5mm}
.outside .p-a{left:3mm;width:97mm}.outside .p-b{left:100mm;width:100mm}.outside .p-c{left:200mm;width:100mm}
.inside .p-a{left:3mm;width:100mm}.inside .p-b{left:103mm;width:100mm}.inside .p-c{left:203mm;width:97mm}
.panel .frame{height:100%;padding:4mm 4.2mm 3.6mm;border-width:.5mm;border-radius:3mm;box-shadow:inset 0 0 0 1mm #1a1411,inset 0 0 0 1.2mm rgba(240,168,58,.38)}
.gold{color:#f5b54a;text-shadow:0 .3mm 0 #7a4a10}
.title{font-size:11.5pt;gap:2.4mm;margin-bottom:2.2mm}
.dia{width:1.6mm;height:1.6mm;box-shadow:0 0 0 .35mm #f0a83a}
.list{display:grid;gap:1.7mm}
.item{margin:0}
.name,.price{font-size:9pt}
.note{font-size:6.4pt}
.dots{min-width:3mm;border-bottom-width:.3mm}
.stack{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between;gap:2.5mm}
.photo-band{position:relative;overflow:hidden;height:30mm;border-radius:2mm;border:.25mm solid rgba(240,168,58,.45);margin-bottom:3.4mm;display:flex;flex-direction:column;justify-content:flex-end;padding:2.4mm 3.6mm;flex:none}
.photo-band>p,.photo-band>h2{position:relative}
.photo-band .script{font-size:14pt}
.band-h{font-family:Playfair,serif;font-weight:700;font-size:19pt;line-height:1;text-transform:uppercase}
.lead{font-family:Playfair,serif;font-weight:700;font-size:15pt;line-height:1.15}
.body{font-size:8.6pt;line-height:1.45;margin-top:1.6mm;color:rgba(243,230,204,.92)}
.notes{display:grid;gap:2.2mm;font-size:7.8pt;line-height:1.4;color:rgba(243,230,204,.88)}
.notes b{display:block;font-family:Playfair,serif;font-style:italic;font-size:9.6pt;color:#f8d596}
.visit{text-align:center;font-size:8.4pt;line-height:1.45}
.visit .phone{font-family:Playfair,serif;font-weight:700;font-size:12pt;color:#f0a83a;margin-top:1mm}
.deals{display:grid;gap:1.4mm}
.deal{padding:1.5mm 3mm;border-radius:2mm;gap:.3mm}
.deal h3{font-size:9.2pt}
.deal p{font-size:6.7pt;line-height:1.25}
.deal b{font-size:8.8pt;padding:.2mm 3mm}
.buffet-box{border-radius:2.5mm;padding:2.6mm 3.5mm;text-align:center;background:linear-gradient(135deg,#d40b12,#9c0509);box-shadow:inset 0 -.8mm 0 #f0a83a;font-size:7.6pt;line-height:1.35}
.bb-head{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:11pt;text-transform:uppercase;color:#f8d596}
.bb-prices b{font-family:Playfair,serif;font-size:10pt;color:#f8d596}
.fine{font-size:6.6pt;line-height:1.35;text-align:center;color:rgba(243,230,204,.75)}
.qr-row{display:flex;align-items:center;gap:3mm}
.qr-note{font-size:7.2pt;line-height:1.4;color:rgba(243,230,204,.88)}
.qrt{margin:0;flex:none;text-align:center}
.qrt-card{display:block;background:#fff;padding:2.2mm;border-radius:1.5mm;box-shadow:0 0 0 .5mm #f0a83a}
.qrt-card img{display:block;width:100%;height:auto}
.qrt figcaption{margin-top:1mm;font-size:5.8pt;line-height:1.25;color:rgba(243,230,204,.8)}
.qrt figcaption b{display:block;font-size:6.6pt;color:#f8d596}
.offer{border:.3mm solid #f0a83a;border-radius:2.5mm;padding:2.4mm 3mm;margin-bottom:2mm;background:rgba(196,6,12,.16)}
.offer h3{font-family:Playfair,serif;font-size:10pt;color:#f8d596}
.offer-value{font-family:Playfair,serif;font-weight:700;font-size:10pt;color:#f0a83a}
.offer p{font-size:7.2pt;line-height:1.35}
.badge{display:inline-block;padding:.3mm 2.2mm;border-radius:9mm;background:#f0a83a;color:#1a1411;font-size:6pt;font-weight:700;text-transform:uppercase;letter-spacing:.2mm}
.conds{margin-top:1mm;font-size:6.4pt;color:rgba(243,230,204,.8)}
/* P5 delivery and bar split */
.split main{justify-content:space-between}
.half{display:flex;flex-direction:column;gap:3mm}
.divider{height:.3mm;background:repeating-linear-gradient(90deg,#f0a83a 0 2mm,transparent 2mm 3.4mm);opacity:.7;margin:1mm 0}
.terms-list{display:grid;gap:1.2mm;font-size:7.8pt;line-height:1.3}
.terms-list li::before{content:"";display:inline-block;width:1.5mm;height:1.5mm;margin-right:1.6mm;background:#c4060c;box-shadow:0 0 0 .3mm #f0a83a;transform:rotate(45deg) translateY(-.3mm)}
.terms-list b{color:#f8d596;font-family:Playfair,serif}
/* P6 back */
.back main{justify-content:space-between;text-align:center}
.back-logo{width:26mm;margin:0 auto}
.resto{display:flex;align-items:center;justify-content:center;gap:2.6mm;font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:9pt;letter-spacing:1.2mm;text-transform:uppercase;color:#f8d596}
.resto::before,.resto::after{content:"";width:9mm;height:.3mm;background:#f0a83a}
.back-h{font-family:Playfair,serif;font-weight:800;font-size:15pt;line-height:1.1;margin-top:1.4mm;text-transform:uppercase}
.facts{display:grid;gap:2.2mm;font-size:8.4pt;line-height:1.35}
.facts dt{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:8.4pt;color:#f0a83a;text-transform:uppercase}
.facts dd{margin:0}
.qr-pair{display:flex;justify-content:center;gap:6mm}
.brand{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:10pt;color:#f8d596}
.pstrip{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:2mm}
.pstrip div{position:relative;overflow:hidden;height:22mm;border-radius:2mm;border:.25mm solid rgba(240,168,58,.45)}
.photo-band.sm{height:24mm;margin-bottom:0}
.intro .body{font-size:9.6pt}
.intro .notes{font-size:8.6pt;gap:3mm}
.intro .notes b{font-size:10.4pt}
.intro .lead{font-size:16.5pt}
.visit{font-size:9.2pt}
.high .list{gap:2.6mm}
.high .name,.high .price{font-size:10pt}
.split .terms-list{font-size:8.6pt;gap:1.6mm}
.split .body,.split .qr-note{font-size:8pt}
.back .facts{font-size:9.6pt;gap:3mm}
.back .facts dt{font-size:9pt}
.back-logo{width:34mm}
.back-h{font-size:16pt}
/* P1 cover, full bleed photo into the right and top/bottom bleed */
.cover{top:0;height:216mm;padding:0;width:103mm!important}
.cover .frame{position:relative;overflow:hidden;height:100%;border:0;border-radius:0;box-shadow:none;background:#110d0b;padding:14mm 13mm 14mm 10mm;display:flex;flex-direction:column;justify-content:space-between;text-align:center}
.cover .frame>*:not(.ph):not(.shade){position:relative;z-index:1}
/* thin double gold frame 5 mm inside the trim, like the other panels; the photo itself bleeds */
.cover .frame::after{content:"";position:absolute;top:8mm;bottom:8mm;left:5mm;right:8mm;z-index:2;pointer-events:none;border:.5mm solid #f0a83a;border-radius:3mm;box-shadow:inset 0 0 0 1mm rgba(17,13,11,.35),inset 0 0 0 1.2mm rgba(240,168,58,.55)}
.cover-logo{width:50mm;margin:0 auto;filter:drop-shadow(0 2mm 4mm rgba(0,0,0,.6))}
.cover .script{font-family:Vibes,cursive;font-size:24pt;color:#f8d596;margin-top:2mm}
.cover h1{font-family:Playfair,serif;font-weight:700;font-size:34pt;line-height:1;text-transform:uppercase;margin-top:1mm}
.cover .sub{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:9.4pt;color:#f8d596;margin-top:2.4mm}
.cover-high{border-radius:3mm;padding:3mm 4mm;background:linear-gradient(135deg,#d40b12,#9c0509);box-shadow:inset 0 -1mm 0 #f0a83a;font-size:8pt;line-height:1.4}
.ch-head{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:12pt;text-transform:uppercase;color:#f8d596}
.ch-price b{font-family:Playfair,serif;font-size:11pt;color:#f8d596}
.ch-note{font-size:6.8pt;text-transform:uppercase;letter-spacing:.3mm}
`;

// Panels placed in fold order (not reading order), see the header comment.
const outsideSheet = `<div class="sheet outside">${p5DeliveryBar.replace('class="panel split"', 'class="panel split p-a"')}${p6Back.replace('class="panel back"', 'class="panel back p-b"')}${p1Cover.replace('class="panel cover"', 'class="panel cover p-c"')}</div>`;
const insideSheet = `<div class="sheet inside">${p2Intro.replace('class="panel intro"', 'class="panel intro p-a"')}${p3DineIn.replace('class="panel dine"', 'class="panel dine p-b"')}${p4Highlights.replace('class="panel high"', 'class="panel high p-c"')}</div>`;

const leaflet = htmlDocument(`${restaurant.name} Resto Bar | Grand Opening leaflet`, `${outsideSheet}\n${insideSheet}`, "A4-landscape-bleed", css);

const pdfPath = join(outDir, "diago-spice-promo-leaflet.pdf");
writeFileSync(join(outDir, "diago-spice-promo-leaflet.html"), leaflet);
renderPdf(leaflet, pdfPath, process.env.MENU_PREVIEW);

// Mark trim and bleed for the printer: MediaBox = BleedBox = 303 x 216 mm, TrimBox = 297 x 210 mm inset 3 mm.
const mm = (value: number): number => (value / 25.4) * 72;
const doc = await PDFDocument.load(readFileSync(pdfPath));
for (const page of doc.getPages()) {
  page.setBleedBox(0, 0, mm(303), mm(216));
  page.setTrimBox(mm(3), mm(3), mm(297), mm(210));
}
doc.setTitle("Diago Spice Resto Bar, A4 tri-fold leaflet");
writeFileSync(pdfPath, await doc.save());
console.log("Set TrimBox 297 x 210 mm and BleedBox 303 x 216 mm");

// ---------- fold proof ----------
// The proof shows exact screenshots of each printed side (303 x 216 mm at 96 px/in, 2x), so it
// matches the print file rather than a re-flowed copy.
const sideShot = (sheet: string, name: string): string => {
  const png = join(outDir, `proof-${name}.png`);
  renderPng(htmlDocument("side", sheet, "A4-landscape-bleed", `${css}html,body{margin:0;overflow:hidden}`), png, 1145, 816);
  const uri = dataUri(png.replace(`${root}/`, ""), "image/png");
  return `<img class="shot" src="${uri}" alt="${name} side">`;
};
const outsideShot = sideShot(outsideSheet, "outside");
const insideShot = sideShot(insideSheet, "inside");
const proofCss = `${css}
.proof{width:297mm;height:210mm;overflow:hidden;padding:7mm 10mm;color:#1a1411;background:#fff;font-family:Bitter,serif}
.proof h1{font-family:Playfair,serif;font-size:18pt;margin:0 0 2mm}
.proof p{font-size:9pt;margin:0 0 2mm;line-height:1.4}
.scaled{position:relative;width:242.4mm;height:172.8mm;overflow:hidden;margin:3mm 0 1mm;border:.3mm solid #999}
.scaled .shot{display:block;width:242.4mm;height:172.8mm}
.fold{position:absolute;top:0;bottom:0;border-left:.5mm dashed #e2007a;z-index:5}
.lab{position:absolute;top:4mm;z-index:6;background:#e2007a;color:#fff;font:700 8pt Bitter,serif;padding:.6mm 2mm;border-radius:1mm}
.trim{position:absolute;left:2.4mm;top:2.4mm;width:237.6mm;height:168mm;border:.3mm solid #00a0e2;z-index:5}
html,body{background:#fff}`;
const label = (left: number, text: string) => `<span class="lab" style="left:${left}mm">${text}</span>`;
const fold = (x: number) => `<span class="fold" style="left:${(x + 3) * 0.8}mm"></span>`;
const proof = htmlDocument(
  "Diago Spice leaflet fold proof",
  `<div class="proof" style="page-break-after:always">
  <h1>Fold proof, side 1: OUTSIDE</h1>
  <p>Shown at 80%. Blue = trim (297 x 210 mm). Pink dashes = folds at 97 mm and 197 mm from the left trim edge. 3 mm bleed outside the blue line.</p>
  <div class="scaled">${outsideShot}<span class="trim"></span>${fold(97)}${fold(197)}${label(6, "P5 Delivery + Bar (folds in, 97 mm)")}${label(84, "P6 Back cover (100 mm)")}${label(164, "P1 Front cover (100 mm)")}</div>
</div>
<div class="proof" style="page-break-after:always">
  <h1>Fold proof, side 2: INSIDE</h1>
  <p>Printed on the back of side 1, flip on the short edge. Folds at 100 mm and 200 mm from the left trim edge on this side.</p>
  <div class="scaled">${insideShot}<span class="trim"></span>${fold(100)}${fold(200)}${label(6, "P2 Introduction (100 mm)")}${label(86, "P3 Dine in (100 mm)")}${label(166, "P4 Signature dishes (97 mm, folds in first)")}</div>
</div>
<div class="proof">
  <h1>How it folds (roll fold, finished about 99 x 210 mm)</h1>
  <p><b>1.</b> Lay side 2 (INSIDE) face up. Fold P4 Signature dishes (the 97 mm panel on the right) in over P3.</p>
  <p><b>2.</b> Fold P2 + P3 over it, so P1 Front cover ends on top and P6 Back cover on the back.</p>
  <p><b>Reading order:</b> P1 Front cover, then open the cover to see P5 Delivery + Bar (the inside flap), then open fully to P2 Introduction, P3 Dine in and P4 Signature dishes side by side. P6 is the back cover.</p>
  <p><b>Before printing:</b> confirm the printer's panel widths for roll fold A4 (97 / 100 / 100 mm used here), paper weight and whether they want CMYK conversion. Keep text 5 mm inside each panel (already applied).</p>
</div>`,
  "A4-landscape",
  proofCss,
);
renderPdf(proof, join(outDir, "diago-spice-promo-leaflet-fold-proof.pdf"));
