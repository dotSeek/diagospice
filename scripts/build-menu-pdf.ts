// Builds the delivery menu PDF in public/ from the same data the website uses.
// Format: an A4 tri-fold leaflet (roll fold). Two landscape A4 sides, three panels each:
//   page 1, outside:  [fold-in flap 97mm] [back 100mm] [front cover 100mm]
//   page 2, inside:   [left 100mm] [middle 100mm] [right 97mm, back of the flap]
// Print double sided, flip on the short edge, then fold the right inside panel in first.
// Design and print step live in scripts/menu-pdf-kit.ts, shared with the dine in menus.
// Run with: npm run menu:pdf  (needs Google Chrome installed, or set CHROME_PATH)
// Set MENU_PREVIEW=/some/file.html to also keep the HTML for a visual check.
// Also writes public/brand/whatsapp-qr.svg, a real QR code for restaurant.whatsappUrl.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";
import { buffet, categoryById, delivery, formatPrice } from "../src/data/menu.ts";
import type { DealCategory, ItemCategory } from "../src/data/menu.ts";
import { restaurant } from "../src/data/restaurant.ts";
import { band, block, coverPhoto, deals, escapeHtml, htmlDocument, logo, renderPdf, root } from "./menu-pdf-kit.ts";

const cat = (id: string): ItemCategory => categoryById(id) as ItemCategory;

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
const deal = (id: string): DealCategory => categoryById(id) as DealCategory;

const deliveryBand = `<div class="delivery">
  <p class="d-head">${escapeHtml(delivery.headline)}</p>
  <p>${escapeHtml(delivery.beyond)}</p>
  <p class="d-min">Minimum order ${escapeHtml(delivery.minimumOrder)}</p>
</div>`;

const orderRow = `<div class="order order--two">
  <span><small>Call or WhatsApp</small>${restaurant.phoneDisplay}</span>
  <span><small>Online</small>${restaurant.websiteDisplay}</span>
</div>`;

const panel = (body: string, extraClass = ""): string =>
  `<section class="panel ${extraClass}"><div class="frame"><main>${body}</main></div></section>`;

const panelFoot = `<p class="pfoot">${restaurant.name} | ${restaurant.addressInline} | ${restaurant.phoneDisplay}</p>`;

// ---------- Outside: flap, back, cover ----------
const flap = panel(`${band("chips", "Better together", "Deals")}<div class="stack">${deals(deal("meal-deals"))}${deals(deal("rice-curry-deals"))}
  <div class="buffet-box">
    <p class="bb-head">Weekend buffet</p>
    <p>${buffet.days}, ${buffet.hours}</p>
    <p class="bb-prices"><b>${formatPrice(buffet.adultPrice)}</b> adults <b>${formatPrice(buffet.kidsPrice)}</b> ${buffet.kidsNote.toLowerCase()}</p>
    <p>For booking call ${buffet.bookingPhone}</p>
  </div></div>`, "flap");

const back = panel(`<div class="back-head">
    <img class="back-logo" src="${logo}" alt="${restaurant.name} logo">
    <h1 class="gold">Order your favourites!</h1>
    <p>Scan the QR code to order directly through WhatsApp.</p>
  </div>
  <a class="poster" href="${restaurant.whatsappUrl}">
    <i class="star s1"></i><i class="star s2"></i><i class="star s3"></i><i class="star s4"></i>
    <span class="scan-label">SCAN TO ORDER</span>
    <span class="qr-card"><img src="${whatsappQr}" alt="WhatsApp order QR code"></span>
  </a>
  <a class="wa-btn" href="${restaurant.whatsappUrl}">${WA_ICON}ORDER VIA WHATSAPP</a>
  <div class="manual-box">
    <p class="mb-q">Prefer to order manually?</p>
    <p class="mb-t">Order directly on WhatsApp: <a class="mb-n" href="${restaurant.whatsappUrl}">${WA_ICON}${restaurant.phoneDisplay}</a></p>
  </div>
  <section class="terms">
    <h2>Delivery information</h2>
    <ul>
      <li><span class="ic">£</span><span><b>Minimum order ${escapeHtml(delivery.minimumOrder)}</b><small>Depending on delivery location</small></span></li>
      <li><span class="ic">✓</span><span><b>Free delivery</b><small>Within 3 miles</small></span></li>
      <li><span class="ic">+</span><span><b>£2 delivery charge</b><small>For locations beyond 3 miles</small></span></li>
    </ul>
  </section>
  ${panelFoot}`, "back");

const cover = `<section class="panel cover"><div class="frame">${coverPhoto()}
  <img class="cover-logo" src="${logo}" alt="${restaurant.name} logo">
  <div>
    <p class="script">Welcome to Diago Spice</p>
    <h1 class="gold">Menu</h1>
    <p class="sub">Delivery menu</p>
    <div class="chips"><span>Curries</span><span>Kottu</span><span>Biriyani</span><span>Burgers</span><span>Wings</span></div>
  </div>
  <div>
    ${deliveryBand}
    ${orderRow}
  </div>
</div></section>`;

// ---------- Inside: three menu panels ----------
const insideLeft = panel(`${band("wings", "To begin", "Starters")}<div class="stack">${block(cat("starters"), 1)}${block(cat("nan"))}${block(cat("desserts"), 1)}</div>`);
const insideMiddle = panel(`${band("curry", "Slow cooked", "Mains")}<div class="stack">${block(cat("mains"), 1)}${block(cat("rice"), 1)}</div>`, "in-mid");
const insideRight = panel(`${band("burger", "House favourites", "Specials")}<div class="stack">${block(cat("specials"), 1)}${block(cat("burgers"), 1)}${block(cat("chips"), 1)}</div>`, "in-right");

const triCss = `
/* crisp shadow only: Apple's PDF renderer turns blurred text shadows into dark boxes at this size */
.gold{text-shadow:0 .3mm 0 #7a4a10}
.sheet{width:297mm;height:210mm;display:grid;page-break-after:always;overflow:hidden;
  background:radial-gradient(160mm 90mm at 50% 0%,rgba(240,168,58,.12),transparent 70%),#1a1411}
.sheet:last-child{page-break-after:auto}
.outside{grid-template-columns:97mm 100mm 100mm}
.inside{grid-template-columns:100mm 100mm 97mm}
.panel{height:210mm;padding:4.5mm 4mm;min-width:0}
/* every panel: photo band, then a stack whose sections spread evenly down to the frame bottom,
   so headings start at the same height and the last items line up across the spread */
.stack{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between}
.stack .block{margin-bottom:0}
/* share each panel's spare height across its rows so section gaps match on all three inside panels */
.in-mid .item{margin-bottom:1.92mm}
.in-right .item{margin-bottom:1.72mm}
.back main{justify-content:space-between}
.panel .frame{padding:3.4mm 3.8mm 2.6mm;border-width:.5mm;border-radius:3mm;box-shadow:inset 0 0 0 1mm #1a1411,inset 0 0 0 1.2mm rgba(240,168,58,.38)}
.title{font-size:12pt;gap:2.4mm;margin-bottom:2.4mm}
.dia{width:1.6mm;height:1.6mm;box-shadow:0 0 0 .35mm #f0a83a}
.block{margin-bottom:3.6mm}
.list.c1{max-width:none}
.list.c2{column-gap:3.4mm;column-rule-color:rgba(240,168,58,.2)}
.list.c2 .name,.list.c2 .price{font-size:8.4pt}
.item{margin-bottom:1.45mm}
.line{gap:1mm}
.name,.price{font-size:8.8pt}
.note{font-size:6.3pt;line-height:1.1}
.dots{min-width:3mm;border-bottom-width:.3mm}
.band{height:21mm;margin-bottom:3.4mm;padding:2.2mm 3.6mm;border-radius:2mm}

.band .script{font-size:13pt}
.band h1{font-size:20pt}
.deals{grid-template-columns:1fr;gap:1.3mm}
.deal{padding:1.35mm 3mm;border-radius:2mm;gap:.4mm}
.deal h3{font-size:9.4pt}
.deal p{font-size:6.8pt;line-height:1.25}
.deal b{font-size:9pt;padding:.3mm 3mm}
.buffet-box{border-radius:2.5mm;padding:2.6mm 3.5mm;text-align:center;background:linear-gradient(135deg,#d40b12,#9c0509);box-shadow:inset 0 -.8mm 0 #f0a83a;font-size:7.6pt;line-height:1.35}
.bb-head{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:11pt;text-transform:uppercase;color:#f8d596}
.bb-prices b{font-family:Playfair,serif;font-size:10pt;color:#f8d596}
/* back panel */
.back main{align-items:stretch}
.back-head{text-align:center}
.back-logo{width:20mm;margin:0 auto 1mm}
.back-head h1{font-size:14.5pt}
.back-head p{font-size:7.6pt;margin-top:1mm}
.poster{margin:3.2mm auto 0;width:62mm;padding:2.4mm}
.scan-label{font-size:8.6pt;letter-spacing:.45mm;margin-bottom:1.4mm}
.qr-card{padding:3.4mm}
.wa-btn{margin:3.2mm auto 0;padding:2mm 4mm;font-size:8.4pt;gap:2mm;width:66mm}
.wa-btn svg{width:4.6mm;height:4.6mm}
.manual-box{text-align:center;line-height:1.25}
.mb-q{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:9pt;color:#f8d596}
.mb-t{display:flex;align-items:center;justify-content:center;gap:1.4mm;white-space:nowrap;font-size:7.6pt;color:rgba(243,230,204,.9);margin-top:.8mm}
.mb-n{display:inline-flex;align-items:center;gap:1mm;font-family:Playfair,serif;font-weight:700;font-size:10pt;color:#f0a83a;text-decoration:none;white-space:nowrap;font-variant-numeric:lining-nums}
.mb-n svg{width:3.6mm;height:3.6mm;flex:none}
.terms{margin-top:3mm;padding:2.6mm 3.2mm;border-radius:2.5mm}
.terms h2{font-size:9.6pt;margin-bottom:1.6mm}
.terms ul{gap:1.2mm}
.terms li{font-size:7.2pt;gap:2.4mm;line-height:1.2}
.terms li small{display:block;font-size:6.6pt;color:rgba(243,230,204,.85)}
.terms li b{font-size:7.8pt}
.terms .ic{width:5mm;height:5mm;font-size:7pt}
.pfoot{font-size:6.2pt;text-align:center;color:rgba(243,230,204,.7);border-top:.25mm solid rgba(240,168,58,.35);padding-top:1.6mm}
/* cover panel: full bleed photo */
.cover{padding:0}
.cover .frame{height:100%;padding:9mm 8mm 8mm;border-radius:0}
.cover .frame::after{box-shadow:inset 0 0 0 4mm #110d0b,inset 0 0 0 4.5mm #f0a83a,inset 0 0 0 5.5mm rgba(17,13,11,.4),inset 0 0 0 5.7mm rgba(240,168,58,.5)}
.cover-logo{width:46mm}
.cover .script{font-size:17pt}
.cover h1{font-size:50pt}
.cover .sub{font-size:8.6pt;gap:3mm}
.cover .sub::before,.cover .sub::after{width:10mm}
.chips{gap:1.2mm;margin-top:2.6mm}
.chips span{font-size:6.6pt;padding:.4mm 2.2mm}
.cover .delivery{padding:2.6mm 3.2mm;font-size:7.2pt}
.cover .d-head{font-size:10.5pt}
.cover .d-min{padding:.3mm 3mm}
.order{gap:1.6mm;margin-top:2.2mm}
.order span{font-size:7.6pt;padding:1.3mm 1mm}
.order--two{grid-template-columns:1fr 1fr}
.order--two span{font-size:9pt;padding:1.5mm 1mm;white-space:nowrap}
.order small{font-size:5.4pt}
`;

const menu = htmlDocument(
  `${restaurant.name} Delivery Menu | ${restaurant.addressInline}`,
  `<div class="sheet outside">${flap}${back}${cover}</div>
<div class="sheet inside">${insideLeft}${insideMiddle}${insideRight}</div>`,
  "A4-landscape",
  triCss,
);

renderPdf(menu, join(root, "public", "diago-spice-menu.pdf"), process.env.MENU_PREVIEW);
