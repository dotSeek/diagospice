// Branded printable QR codes for the restaurant and bar table menus.
// Each PDF has an A6 table card (page 1) and an A4 poster (page 2), plus a 2400 px PNG.
// The codes point at fixed addresses (/restaurant-menu/ and /bar-menu/) that always show the
// latest published menu and offers, so they never need reprinting after a price or offer change.
// Outputs: public/qr/diago-spice-{restaurant,bar}-menu-qr.pdf and .png (only links, no prices).
// Run with: npm run qr
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";
import { restaurant } from "../src/data/restaurant.ts";
import { escapeHtml, htmlDocument, logo, renderPdf, root } from "./menu-pdf-kit.ts";

const outDir = join(root, "public", "qr");
mkdirSync(outDir, { recursive: true });

const cards = [
  { id: "restaurant", heading: "Restaurant menu", line: "Scan to Explore Our Food Menu & Grand Opening Specials", order: "Please order with our staff", path: "/restaurant-menu/" },
  { id: "bar", heading: "Bar menu", line: "Scan to Explore Our Drinks Menu & Opening Specials", order: "Please order at the bar", path: "/bar-menu/" },
] as const;

const css = `
@page card{size:105mm 148mm;margin:0}
@page poster{size:210mm 297mm;margin:0}
html,body{background:#1a1411}
.sheet{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;background:radial-gradient(120mm 80mm at 50% 0%,rgba(240,168,58,.16),transparent 70%),#1a1411;color:#f3e6cc}
.card{page:card;width:105mm;height:148mm;padding:9mm 8mm 8mm;page-break-after:always}
.poster{page:poster;width:210mm;height:297mm;padding:20mm 20mm 18mm}
.sheet::after{content:"";position:absolute;inset:4mm;border:.6mm solid #f0a83a;border-radius:3mm;box-shadow:inset 0 0 0 1.3mm #1a1411,inset 0 0 0 1.55mm rgba(240,168,58,.45);pointer-events:none}
.poster::after{inset:8mm;border-width:1mm}
.sheet>*{position:relative;z-index:1;align-self:stretch;text-align:center}
.sheet>.qc-logo,.sheet>.qc-qr{align-self:center}
.qc-logo{width:26mm}.poster .qc-logo{width:48mm}
.qc-resto{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:8pt;letter-spacing:1.4mm;text-transform:uppercase;color:#f8d596;display:flex;align-items:center;gap:2.4mm;justify-content:center}
.qc-resto::before,.qc-resto::after{content:"";width:7mm;height:.3mm;background:#f0a83a}
.poster .qc-resto{font-size:14pt;letter-spacing:1.6mm;white-space:nowrap}.poster .qc-resto::before,.poster .qc-resto::after{width:20mm}
h1{font-family:Playfair,serif;font-weight:800;font-size:21pt;line-height:1;text-transform:uppercase;color:#f5b54a;text-shadow:0 .3mm 0 #7a4a10;margin-top:1.5mm}
.poster h1{font-size:48pt;margin-top:3mm}
.qc-line{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:9pt;line-height:1.3;color:#f8d596;max-width:80mm}
.poster .qc-line{font-size:19pt;max-width:160mm}
.qc-qr{background:#fff;padding:3mm;border-radius:2mm;box-shadow:0 0 0 .6mm #f0a83a;width:58mm}
.poster .qc-qr{width:108mm;padding:6mm;box-shadow:0 0 0 1.2mm #f0a83a}
.qc-qr img{display:block;width:100%;height:auto}
.qc-order{font-family:Playfair,serif;font-weight:700;font-size:10pt;color:#f3e6cc}
.poster .qc-order{font-size:20pt}
.qc-foot{font-size:6.6pt;line-height:1.35;color:rgba(243,230,204,.8)}
.poster .qc-foot{font-size:12pt}
.qc-brand{font-family:Vibes,cursive;font-size:13pt;color:#f8d596}.poster .qc-brand{font-size:30pt}
`;

for (const card of cards) {
  const url = `${restaurant.websiteUrl}${card.path}`;
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#1a1411", light: "#ffffff" } });
  const qr = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const inner = (poster: boolean) => `
    <img class="qc-logo" src="${logo}" alt="${restaurant.name} logo">
    <div><p class="qc-resto">Diago Spice Resto Bar</p><h1>${escapeHtml(card.heading)}</h1></div>
    <p class="qc-line">${escapeHtml(card.line)}</p>
    <div class="qc-qr"><img src="${qr}" alt="QR code for ${escapeHtml(url)}"></div>
    <p class="qc-order">${escapeHtml(card.order)}</p>
    ${poster ? `<p class="qc-brand">Desi Spice. Western Soul. Big Flavours!</p>` : ""}
    <p class="qc-foot">${restaurant.name}, ${restaurant.addressInline}<br>${url.replace("https://", "")}</p>`;
  const html = htmlDocument(`${card.heading} QR`, `<div class="sheet card">${inner(false)}</div><div class="sheet poster">${inner(true)}</div>`, "custom", css);
  renderPdf(html, join(outDir, `diago-spice-${card.id}-menu-qr.pdf`));
  await QRCode.toFile(join(outDir, `diago-spice-${card.id}-menu-qr.png`), url, { errorCorrectionLevel: "M", margin: 4, width: 2400, color: { dark: "#1a1411", light: "#ffffff" } });
  writeFileSync(join(outDir, `diago-spice-${card.id}-menu-qr.svg`), await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 4, color: { dark: "#1a1411", light: "#ffffff" } }));
}
console.log("Wrote public/qr/*");
