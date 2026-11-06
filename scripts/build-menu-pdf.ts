// Builds the delivery menu PDF in public/ from the same data the website uses.
// Format: an 8 page B5 booklet (176 x 250 mm pages). Print on B4 sheets, fold in
// half and staple, so page 1 is the front cover and page 8 the back cover.
// Design and print step live in scripts/menu-pdf-kit.ts, shared with the dine in menus.
// Run with: npm run menu:pdf  (needs Google Chrome installed, or set CHROME_PATH)
// Set MENU_PREVIEW=/some/file.html to also keep the HTML for a visual check.
// Also writes public/brand/whatsapp-qr.svg, a real QR code for restaurant.whatsappUrl.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";
import { buffet, categoryById, delivery } from "../src/data/menu.ts";
import type { DealCategory, ItemCategory } from "../src/data/menu.ts";
import { restaurant } from "../src/data/restaurant.ts";
import { band, block, buffetPage, coverPhoto, deals, escapeHtml, htmlDocument, logo, page, renderPdf, root, strip } from "./menu-pdf-kit.ts";

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

const cover = `<div class="page cover"><div class="frame">${coverPhoto()}
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

const menu = htmlDocument(
  `${restaurant.name} Delivery Menu | ${restaurant.addressInline}`,
  [
    cover,
    page(2, `${band("wings", "To begin", "Starters")}${block(cat("starters"))}${block(cat("nan"))}`),
    page(3, `${band("curry", "Slow cooked", "Mains")}${block(cat("mains"))}${block(cat("chips"))}`),
    page(4, `${band("biriyani", "House favourites", "Rice and specials")}${block(cat("rice"))}${block(cat("specials"))}`),
    page(5, `${band("burger", "Stacked high", "Burgers")}${block(cat("burgers"), 1)}${block(cat("desserts"))}${strip("dessert", "chips", "wings")}<div class="spacer"></div>${deliveryBand}`),
    page(6, `${band("chips", "Better together", "Deals")}${deals(categoryById("meal-deals") as DealCategory)}${deals(categoryById("rice-curry-deals") as DealCategory)}`),
    buffetPage(7, buffet),
    back,
  ].join("\n"),
  "B5",
);

renderPdf(menu, join(root, "public", "diago-spice-menu.pdf"), process.env.MENU_PREVIEW);
