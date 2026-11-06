// Builds the delivery menu PDF in public/ from the same data the website uses.
// Format: an 8 page B5 booklet (176 x 250 mm pages). Print on B4 sheets, fold in
// half and staple, so page 1 is the front cover and page 8 the back cover.
// Colours follow the website: night background, gold lines and prices, red bands.
// Run with: npm run menu:pdf  (needs Google Chrome installed, or set CHROME_PATH)
// Set MENU_PREVIEW=/some/file.html to also keep the HTML for a visual check.
// Also writes public/brand/whatsapp-qr.svg, a real QR code for restaurant.whatsappUrl.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import QRCode from "qrcode";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buffet, categoryById, delivery, formatPrice } from "../src/data/menu.ts";
import type { DealCategory, ItemCategory, MenuItemData } from "../src/data/menu.ts";
import { restaurant } from "../src/data/restaurant.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const chrome = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const fileUrl = (path: string): string => pathToFileURL(join(root, path)).href;

const dataUri = (path: string, mime: string): string =>
  `data:${mime};base64,${readFileSync(join(root, path)).toString("base64")}`;

const logo = dataUri("public/brand/logo.webp", "image/webp");
const qr = dataUri("public/brand/menu-qr.png", "image/png");

// WhatsApp order QR: generated from the live link so it can never drift from it.
// Dark on white, error correction M, no built in margin (the white card gives the quiet zone).
const whatsappQrSvg = await QRCode.toString(restaurant.whatsappUrl, {
  type: "svg",
  errorCorrectionLevel: "M",
  margin: 0,
  color: { dark: "#1a1411", light: "#ffffff" },
});
writeFileSync(join(root, "public", "brand", "whatsapp-qr.svg"), whatsappQrSvg);
const whatsappQr = `data:image/svg+xml;base64,${Buffer.from(whatsappQrSvg).toString("base64")}`;
const WA_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3z"/></svg>';
// Illustrative stock photos, the same ones the website uses (see src/data/images.ts).
const photo = (name: string): string => dataUri(`assets-src/photos/${name}.jpg`, "image/jpeg");

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const items = (list: MenuItemData[]): string =>
  list
    .map(
      (item) =>
        `<li class="item"><div class="line"><span class="name">${escapeHtml(item.name)}</span><span class="dots"></span><span class="price">${formatPrice(item.price)}</span></div>${item.note ? `<span class="note">${escapeHtml(item.note)}</span>` : ""}</li>`,
    )
    .join("");

const title = (text: string): string =>
  `<h2 class="title"><i class="dia"></i><span>${escapeHtml(text)}</span><i class="dia"></i></h2>`;

const block = (id: string, cols = 2): string => {
  const category = categoryById(id) as ItemCategory;
  return `<section class="block">${title(category.label)}<ul class="list c${cols}">${items(category.items)}</ul></section>`;
};

const deals = (id: string): string => {
  const category = categoryById(id) as DealCategory;
  const cards = category.deals
    .map(
      (deal) =>
        `<article class="deal"><h3>${escapeHtml(deal.name)}</h3><p>${escapeHtml(deal.includes.join(", "))}</p><b>${formatPrice(deal.price)}</b></article>`,
    )
    .join("");
  return `<section class="block">${title(category.label)}<div class="deals">${cards}</div></section>`;
};

const band = (image: string, kicker: string, heading: string): string =>
  `<header class="band" style="background-image:linear-gradient(180deg,rgba(17,13,11,.1) 0%,rgba(17,13,11,.3) 45%,rgba(17,13,11,.92) 100%),url(${photo(image)})"><p class="script">${escapeHtml(kicker)}</p><h1 class="gold">${escapeHtml(heading)}</h1></header>`;

const foot = (n: number): string =>
  `<footer class="foot"><span>${restaurant.name} | ${restaurant.addressInline}</span><span>${restaurant.phoneDisplay}</span><span class="pn">${n}</span></footer>`;

const page = (n: number, body: string): string =>
  `<div class="page"><div class="frame"><main>${body}</main>${foot(n)}</div></div>`;

const deliveryBand = `<div class="delivery">
  <p class="d-head">${escapeHtml(delivery.headline)}</p>
  <p>${escapeHtml(delivery.beyond)}</p>
  <p class="d-min">Minimum order ${escapeHtml(delivery.minimumOrder)}</p>
</div>`;

const orderRow = `<div class="order">
  <span><small>Call to order</small>${restaurant.phoneDisplay}</span>
  <span><small>WhatsApp</small>${restaurant.phoneDisplay}</span>
  <span><small>Online</small>${restaurant.websiteDisplay}</span>
</div>`;

const styles = `
@font-face{font-family:Playfair;src:url(${fileUrl("node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2")});font-weight:400 900}
@font-face{font-family:Playfair;font-style:italic;src:url(${fileUrl("node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2")});font-weight:400 900}
@font-face{font-family:Bitter;src:url(${fileUrl("node_modules/@fontsource-variable/bitter/files/bitter-latin-wght-normal.woff2")});font-weight:100 900}
@font-face{font-family:Vibes;src:url(${fileUrl("node_modules/@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff2")})}
@page{size:176mm 250mm;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0}
body{font-family:Bitter,serif;color:#f3e6cc;font-variant-numeric:lining-nums}
h1,h2,h3,p,ul,dl,figure{margin:0;padding:0}ul{list-style:none}i{font-style:normal}
.page{width:176mm;height:250mm;overflow:hidden;page-break-after:always;position:relative;padding:5mm;
  background:radial-gradient(140mm 90mm at 50% 0%,rgba(240,168,58,.14),transparent 70%),#1a1411}
.page:last-child{page-break-after:auto}
.frame{height:100%;border:.6mm solid #f0a83a;border-radius:3.5mm;box-shadow:inset 0 0 0 1.2mm #1a1411,inset 0 0 0 1.45mm rgba(240,168,58,.4);padding:5mm 6mm 3.5mm;display:flex;flex-direction:column;position:relative}
main{flex:1;min-height:0;display:flex;flex-direction:column}
.gold{color:#f5b54a;text-shadow:0 .3mm 0 #8a5512,0 .8mm 2mm rgba(0,0,0,.55)}
.script{font-family:Vibes,cursive;color:#f8d596;line-height:1}
.dia{display:inline-block;flex:none;width:2mm;height:2mm;background:#c4060c;box-shadow:0 0 0 .45mm #f0a83a;border-radius:.3mm;transform:rotate(45deg)}
.foot{display:flex;justify-content:space-between;align-items:center;gap:4mm;margin-top:3mm;padding-top:2.2mm;border-top:.25mm solid rgba(240,168,58,.35);font-size:6.8pt;color:rgba(243,230,204,.75)}
.pn{display:grid;place-items:center;width:5.5mm;height:5.5mm;border-radius:50%;background:linear-gradient(180deg,#fde4ab,#f0a83a 58%,#c9801f);color:#1a1411;font-weight:700}
.band{height:56mm;border-radius:2.5mm;background-size:cover;background-position:center;display:flex;flex-direction:column;justify-content:flex-end;padding:4mm 6mm;border:.25mm solid rgba(240,168,58,.45);margin-bottom:5mm;flex:none}
.band .script{font-size:22pt;margin-bottom:.5mm}
.band h1{font-family:Playfair,serif;font-weight:700;font-size:34pt;line-height:1;text-transform:uppercase;letter-spacing:-.3mm}
.title{display:flex;align-items:center;justify-content:center;gap:4mm;font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:17pt;line-height:1.1;text-transform:uppercase;color:#f8d596;margin-bottom:5mm}
.title::before,.title::after{content:"";flex:1;height:.25mm;background:linear-gradient(90deg,transparent,rgba(240,168,58,.6))}
.title::after{background:linear-gradient(90deg,rgba(240,168,58,.6),transparent)}
.block{margin-bottom:8mm;break-inside:avoid}
.list.c2{columns:2;column-gap:8mm;column-rule:.25mm solid rgba(240,168,58,.25)}
.list.c1{max-width:110mm;margin:0 auto}
.item{break-inside:avoid;margin-bottom:3.6mm}
.line{display:flex;align-items:baseline;gap:1.4mm}
.name{font-family:Playfair,serif;font-weight:600;font-size:11.6pt;line-height:1.2;color:#f3e6cc}
.dots{flex:1;min-width:4mm;border-bottom:.35mm dotted rgba(240,168,58,.55);transform:translateY(-.6mm)}
.price{font-family:Playfair,serif;font-weight:700;font-size:11.6pt;color:#f0a83a;white-space:nowrap}
.note{display:block;font-size:8pt;line-height:1.2;color:rgba(243,230,204,.7)}
.deals{display:grid;grid-template-columns:1fr 1fr;gap:3mm}
.deal{border:.25mm solid rgba(240,168,58,.45);border-radius:2.5mm;padding:4mm 4mm;background:linear-gradient(180deg,rgba(240,168,58,.1),rgba(196,6,12,.1));text-align:center;display:flex;flex-direction:column;gap:1mm}
.deal h3{font-family:Playfair,serif;font-weight:700;font-size:12.5pt;color:#f8d596;line-height:1.15}
.deal p{font-size:8.6pt;line-height:1.3;color:rgba(243,230,204,.85);flex:1}
.deal b{align-self:center;font-family:Playfair,serif;font-size:12pt;color:#1a1411;background:linear-gradient(180deg,#fde4ab,#f0a83a 58%,#c9801f);border-radius:9mm;padding:.6mm 4mm}
.delivery{border-radius:3mm;padding:3.5mm 5mm;text-align:center;background:linear-gradient(135deg,#d40b12,#9c0509);box-shadow:inset 0 -1mm 0 #f0a83a;color:#f3e6cc;font-size:8.6pt;line-height:1.35;flex:none}
.d-head{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:14pt;color:#f8d596;margin-bottom:.8mm}
.d-min{display:inline-block;margin-top:1.4mm;padding:.5mm 4mm;border-radius:9mm;background:#1a1411;color:#f0a83a;font-weight:700}
.order{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm;margin-top:3mm}
.order span{border:.25mm solid rgba(240,168,58,.45);border-radius:2.5mm;padding:1.8mm 2.5mm;background:rgba(17,13,11,.75);font-family:Playfair,serif;font-weight:700;font-size:9.5pt;text-align:center;color:#f3e6cc}
.order small{display:block;font-family:Bitter,serif;font-weight:400;font-size:6.3pt;letter-spacing:.25mm;text-transform:uppercase;color:#f0a83a}
.spacer{flex:1}
.cover{padding:0;background:#110d0b}
.cover .frame{border-radius:0;border-width:0;box-shadow:inset 0 0 0 5mm #110d0b,inset 0 0 0 5.6mm #f0a83a,inset 0 0 0 6.8mm rgba(17,13,11,.4),inset 0 0 0 7.05mm rgba(240,168,58,.5);background-size:cover;background-position:center;padding:11mm 12mm 11mm;justify-content:space-between;text-align:center}
.cover-logo{width:64mm;margin:0 auto;filter:drop-shadow(0 2mm 4mm rgba(0,0,0,.6))}
.cover .script{font-size:30pt}
.cover h1{font-family:Playfair,serif;font-weight:700;font-size:78pt;line-height:.92;text-transform:uppercase;letter-spacing:-1mm;filter:drop-shadow(0 1mm 2mm rgba(0,0,0,.6))}
.cover .sub{display:flex;align-items:center;gap:4mm;justify-content:center;font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:12pt;text-transform:uppercase;color:#f8d596;margin-top:1.5mm}
.cover .sub::before,.cover .sub::after{content:"";width:16mm;height:.3mm;background:#f0a83a}
.chips{display:flex;flex-wrap:wrap;justify-content:center;gap:1.8mm;margin-top:4mm}
.chips span{padding:.6mm 3mm;border:.25mm solid rgba(240,168,58,.6);border-radius:9mm;background:rgba(17,13,11,.7);font-size:7.6pt;color:#f8d596}
.when{display:flex;align-items:center;justify-content:space-between;gap:4mm;margin-bottom:5mm}
.when p{font-size:9pt;line-height:1.4}
.when strong{display:block;font-family:Playfair,serif;font-style:italic;font-size:12pt;color:#f8d596;text-transform:uppercase}
.bp{text-align:center;font-size:7.5pt;padding:2mm 4mm;border-radius:2.5mm;background:linear-gradient(135deg,#d40b12,#9c0509);box-shadow:inset 0 -.8mm 0 #f0a83a;white-space:nowrap}
.bp b{display:block;font-family:Playfair,serif;font-size:16pt;color:#f8d596}
.bgrid{columns:3;column-gap:6mm}
.bgroup{break-inside:avoid;margin-bottom:4mm}
.bgroup h3{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:11pt;text-transform:uppercase;color:#f0a83a;margin-bottom:1mm}
.bgroup li{font-size:9.6pt;line-height:1.5}
.qr{background:#fff;padding:2mm;border-radius:2mm;text-align:center;box-shadow:0 0 0 .6mm #f0a83a}
.qr img{display:block;width:100%}
.qr figcaption{font-size:6.4pt;color:#1a1411;margin-top:.6mm}
/* back cover: WhatsApp ordering, Western poster style */
.back-head{text-align:center}
.back-logo{width:34mm;margin:0 auto 1.5mm}
.back-head h1{font-family:Playfair,serif;font-weight:800;font-size:27pt;line-height:1;text-transform:uppercase;letter-spacing:.2mm}
.back-head p{font-size:9.6pt;margin-top:1.8mm;color:rgba(243,230,204,.9)}
.rope{display:flex;align-items:center;gap:3mm;justify-content:center;margin:3mm 0;color:#f0a83a;font-size:8pt}
.rope::before,.rope::after{content:"";flex:1;height:1.2mm;background:repeating-linear-gradient(135deg,#f0a83a 0 .5mm,transparent .5mm 1.1mm);opacity:.75}
.scan{display:grid;grid-template-columns:72mm 1fr;gap:6mm;align-items:center}
.poster{display:block;text-decoration:none;color:inherit;position:relative;padding:3mm;border:.5mm solid #f0a83a;border-radius:2mm;background:#241b16}
.poster::before{content:"";position:absolute;inset:1.2mm;border:.25mm dashed rgba(240,168,58,.6);border-radius:1.4mm;pointer-events:none}
.poster .star{position:absolute;width:3.4mm;height:3.4mm;background:#c4060c;box-shadow:0 0 0 .45mm #f0a83a;transform:rotate(45deg);border-radius:.4mm}
.poster .s1{top:-1.7mm;left:-1.7mm}.poster .s2{top:-1.7mm;right:-1.7mm}.poster .s3{bottom:-1.7mm;left:-1.7mm}.poster .s4{bottom:-1.7mm;right:-1.7mm}
.scan-label{display:block;text-align:center;font-family:Playfair,serif;font-weight:800;font-size:12pt;letter-spacing:.6mm;color:#f8d596;margin-bottom:2mm}
.qr-card{display:block;background:#fff;padding:5mm;border-radius:1.5mm}
.qr-card img{display:block;width:100%;height:auto;aspect-ratio:1}
.scan-side{display:flex;flex-direction:column;gap:3.5mm}
.wa-btn{display:flex;align-items:center;justify-content:center;gap:2.5mm;padding:3mm 4mm;border-radius:9mm;background:linear-gradient(180deg,#fde4ab,#f0a83a 58%,#c9801f);color:#1a1411;font-family:Playfair,serif;font-weight:800;font-size:11pt;letter-spacing:.3mm;text-decoration:none;box-shadow:0 0 0 .5mm #1a1411,0 0 0 .8mm #f0a83a}
.wa-btn svg{width:6mm;height:6mm;flex:none}
.manual{font-size:9pt;line-height:1.45}
.manual strong{display:block;font-family:Playfair,serif;font-style:italic;font-size:11pt;color:#f8d596}
.manual a{color:#f0a83a;font-family:Playfair,serif;font-weight:700;font-size:13pt;text-decoration:none}
.terms{margin-top:4mm;border-radius:3mm;padding:4mm 5mm;background:linear-gradient(135deg,#d40b12,#9c0509);box-shadow:inset 0 -1mm 0 #f0a83a}
.terms h2{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:13pt;text-transform:uppercase;color:#f8d596;text-align:center;margin-bottom:2.5mm}
.terms ul{display:grid;gap:2mm}
.terms li{display:flex;align-items:center;gap:3mm;font-size:10pt;line-height:1.3}
.terms li b{font-family:Playfair,serif;color:#f8d596;font-size:11.5pt}
.terms .ic{flex:none;display:grid;place-items:center;width:7mm;height:7mm;border-radius:50%;background:#1a1411;color:#f0a83a;font-family:Playfair,serif;font-weight:800;font-size:9pt;box-shadow:0 0 0 .3mm #f0a83a}
.contact-row{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-top:4mm;font-size:8.4pt;line-height:1.35;text-align:center}
.contact-row b{display:block;font-family:Playfair,serif;font-style:italic;color:#f0a83a;text-transform:uppercase;font-size:8.4pt}
.fb{display:flex;align-items:center;gap:3mm;margin-top:auto;padding-top:3mm;font-size:8pt}
.fb img{width:18mm;background:#fff;padding:1mm;border-radius:1mm}
.strip{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm;margin-top:5mm}
.strip div{height:34mm;border-radius:2.5mm;background-size:cover;background-position:center;border:.25mm solid rgba(240,168,58,.45)}
`;

const document = (pageTitle: string, body: string): string =>
  `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>${pageTitle}</title><style>${styles}</style></head><body>${body}</body></html>`;

const coverBg = `linear-gradient(180deg,rgba(17,13,11,.85) 0%,rgba(17,13,11,.3) 32%,rgba(17,13,11,.45) 55%,rgba(17,13,11,.97) 80%),url(${photo("hero")})`;

const cover = `<div class="page cover"><div class="frame" style="background-image:${coverBg}">
  <img class="cover-logo" src="${logo}" alt="${restaurant.name} logo">
  <div>
    <p class="script">Welcome to Diago Spice</p>
    <h1 class="gold">Menu</h1>
    <p class="sub">Delivery menu</p>
    <div class="chips"><span>Curries</span><span>Kottu</span><span>Biriyani</span><span>Burgers</span><span>Wings</span><span>Meal deals</span></div>
  </div>
  <div>
    ${deliveryBand}
    ${orderRow}
  </div>
</div></div>`;

const buffetPage = page(
  7,
  `${band("dining", "Friday to Sunday", "Buffet")}
  <div class="when">
    <p><strong>${buffet.days}</strong>${buffet.hours}<br>For booking call ${buffet.bookingPhone}</p>
    <div class="bp"><b>${formatPrice(buffet.adultPrice)}</b>Adults</div>
    <div class="bp"><b>${formatPrice(buffet.kidsPrice)}</b>${buffet.kidsNote}</div>
  </div>
  <div class="bgrid">${buffet.groups
    .map(
      (group) =>
        `<div class="bgroup"><h3>${escapeHtml(group.title)}</h3><ul>${group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`,
    )
    .join("")}</div>
  <div class="fb"><img src="${qr}" alt="Facebook QR code"><span>Follow us on Facebook<br><b style="color:#f0a83a">${restaurant.facebookName}</b></span></div>`,
);

const waDisplay = restaurant.phoneDisplay;

const back = page(
  8,
  `<div class="back-head">
    <img class="back-logo" src="${logo}" alt="${restaurant.name} logo">
    <h1 class="gold">Order your favourites!</h1>
    <p>Scan the QR code to order directly through WhatsApp.</p>
  </div>
  <div class="rope">✦</div>
  <div class="scan">
    <a class="poster" href="${restaurant.whatsappUrl}">
      <i class="star s1"></i><i class="star s2"></i><i class="star s3"></i><i class="star s4"></i>
      <span class="scan-label">SCAN TO ORDER</span>
      <span class="qr-card"><img src="${whatsappQr}" alt="WhatsApp order QR code"></span>
    </a>
    <div class="scan-side">
      <a class="wa-btn" href="${restaurant.whatsappUrl}">${WA_ICON}ORDER VIA WHATSAPP</a>
      <p class="manual"><strong>Prefer to order manually?</strong>Order directly on WhatsApp:<br><a href="${restaurant.whatsappUrl}">${waDisplay}</a></p>
      <p class="manual">Or call us on <a href="${restaurant.phoneHref}" style="font-size:11pt">${restaurant.phoneDisplay}</a></p>
    </div>
  </div>
  <section class="terms">
    <h2>Delivery information</h2>
    <ul>
      <li><span class="ic">£</span><span><b>Minimum order £15 to £20</b> (depending on delivery location)</span></li>
      <li><span class="ic">✓</span><span><b>Free delivery</b> within 3 miles</span></li>
      <li><span class="ic">+</span><span><b>£2 additional delivery charge</b> for locations beyond 3 miles</span></li>
    </ul>
  </section>
  <div class="spacer"></div>
  <div class="contact-row">
    <div><b>Address</b>${restaurant.addressInline}</div>
    <div><b>Website</b><a href="${restaurant.websiteUrl}" style="color:inherit;text-decoration:none">${restaurant.websiteDisplay}</a></div>
    <div><b>Buffet</b>Fri, Sat, Sun<br>${buffet.hours}</div>
  </div>`,
);

const menu = document(
  `${restaurant.name} Delivery Menu | ${restaurant.addressInline}`,
  [
    cover,
    page(2, `${band("wings", "To begin", "Starters")}${block("starters")}${block("nan")}`),
    page(3, `${band("curry", "Slow cooked", "Mains")}${block("mains")}${block("chips")}`),
    page(4, `${band("biriyani", "House favourites", "Rice and specials")}${block("rice")}${block("specials")}`),
    page(5, `${band("burger", "Stacked high", "Burgers")}${block("burgers", 1)}${block("desserts")}<div class="strip" style="margin-top:0"><div style="background-image:url(${photo("dessert")})"></div><div style="background-image:url(${photo("chips")})"></div><div style="background-image:url(${photo("wings")})"></div></div><div class="spacer"></div>${deliveryBand}`),
    page(6, `${band("chips", "Better together", "Deals")}${deals("meal-deals")}${deals("rice-curry-deals")}`),
    buffetPage,
    back,
  ].join("\n"),
);

const workDir = mkdtempSync(join(tmpdir(), "diago-menu-"));
const htmlPath = join(workDir, "menu.html");
const outPath = join(root, "public", "diago-spice-menu.pdf");
writeFileSync(htmlPath, menu);
if (process.env.MENU_PREVIEW) writeFileSync(process.env.MENU_PREVIEW, menu);
execFileSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--allow-file-access-from-files",
    "--virtual-time-budget=8000",
    `--print-to-pdf=${outPath}`,
    pathToFileURL(htmlPath).href,
  ],
  { stdio: "pipe" },
);
console.log(`Wrote ${outPath}`);
rmSync(workDir, { recursive: true, force: true });
