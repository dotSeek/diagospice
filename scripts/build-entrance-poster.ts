// A4 Special Offers poster for the glass entrance door or window.
// Layout: logo and headline on the website's leaf wallpaper, a row of three framed food photos,
// the offer panel with the QR code, then the footer.
// It is permanent: no dishes, prices, dates or opening messages are printed. Its one QR code opens
// the fixed address /offers/, which shows the restaurant offers and the bar offers that are live
// right now (each linking to its own full menu), so the poster never needs reprinting.
//
// Outputs (public/poster/, links only, safe to publish):
//   diago-spice-offers-poster.pdf         A4 210 x 297 mm, for office or shop printers
//   diago-spice-offers-poster-bleed.pdf   216 x 303 mm with 3 mm bleed, TrimBox and BleedBox set
//   diago-spice-offers-poster.png         2480 x 3508 px, 300 DPI
//   diago-spice-offers-poster-preview.jpg small preview for the admin dashboard
// Run with: npm run poster
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { restaurant } from "../src/data/restaurant.ts";
import { htmlDocument, logo, photo, renderPdf, renderPng, root } from "./menu-pdf-kit.ts";

const outDir = join(root, "public", "poster");
mkdirSync(outDir, { recursive: true });
const base = join(outDir, "diago-spice-offers-poster");

// Q level error correction tolerates glare and smudges on glass. The white quiet zone is added by
// the card padding (4 modules or more), never by a patterned or dark background.
const qr = async (path: string) => {
  const svg = await QRCode.toString(`${restaurant.websiteUrl}${path}`, { type: "svg", errorCorrectionLevel: "Q", margin: 0, color: { dark: "#120d0a", light: "#ffffff" } });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

// Line icons drawn in gold, in place of emoji, so they print sharp and match the brand.
const plateIcon = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 34h32"/><path d="M11 34a13 13 0 0 1 26 0"/><path d="M24 17v4"/><circle cx="24" cy="15" r="2"/><path d="M6 38h36"/></svg>`;
const glassIcon = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 9h28L24 26z"/><path d="M24 26v12"/><path d="M16 40h16"/><path d="M30 9l6-5"/><circle cx="35" cy="14" r="3.2"/></svg>`;

// One QR code for both: the page behind it keeps restaurant and bar offers in separate sections.
const offersPath = "/offers/";

// The website's wallpaper (--texture-wallpaper in src/styles/theme.css): the same leaf lattice,
// drawn as an inline SVG pattern so it stays sharp vector in every PDF viewer, including Apple's.
const wallpaper = `<svg class="wall" aria-hidden="true"><defs><pattern id="leaf" width="120" height="120" patternUnits="userSpaceOnUse" viewBox="0 0 120 120"><g fill="none" stroke="#33261b" stroke-width="2.5" stroke-linecap="round"><path d="M30 112C14 88 16 66 30 50c14 16 16 38 0 62M30 50C24 34 12 28-2 30c2 14 14 24 32 20M30 50c6-16 18-22 32-20-2 14-14 24-32 20"/><path d="M90 52C74 28 76 6 90-10c14 16 16 38 0 62M90 112C74 88 76 66 90 50M90 50c-6-16-18-22-32-20M90 50c6-16 18-22 32-20-2 14-14 24-32 20"/></g></pattern><radialGradient id="glow" cx="50%" cy="22%" r="60%"><stop offset="0" stop-color="#f0a83a" stop-opacity=".14"/><stop offset="1" stop-color="#f0a83a" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="#110d0b"/><rect width="100%" height="100%" fill="url(#leaf)"/><rect width="100%" height="100%" fill="url(#glow)"/></svg>`;

// The pattern tile is 120 CSS px (about 32 mm), the same size as the website tile.
// Food photos for the picture row (the same photos the website and menus use). No captions, so
// the poster never names a dish that might come off the menu.
const foods = ["curry", "biriyani", "wings"];
const code = await qr(offersPath);

// All sizes are for the 210 x 297 mm trim. --b is the bleed (0 or 3 mm): the background runs into
// it, while every text and QR stays at least 12 mm inside the trim edge.
// Static font files for print, so the PDF embeds real TrueType fonts (variable fonts would be
// turned into Type 3 outlines, which some print shop checks reject). Same typefaces as the site.
const font = (pkg: string, file: string) => pathToFileURL(join(root, "node_modules", "@fontsource", pkg, "files", file)).href;
const printFonts = [
  ["PPlay", "normal", 700, font("playfair-display", "playfair-display-latin-700-normal.woff2")],
  ["PPlay", "normal", 800, font("playfair-display", "playfair-display-latin-800-normal.woff2")],
  ["PPlay", "italic", 700, font("playfair-display", "playfair-display-latin-700-italic.woff2")],
  ["PBitter", "normal", 400, font("bitter", "bitter-latin-400-normal.woff2")],
]
  .map(([family, style, weight, src]) => `@font-face{font-family:${family};font-style:${style};font-weight:${weight};src:url(${src})}`)
  .join("");

const css = (bleed: number) => `${printFonts}
@page{size:${210 + bleed * 2}mm ${297 + bleed * 2}mm;margin:0}
html,body{background:#110d0b}
body{font-family:PBitter,serif}
.sheet{--b:${bleed}mm;position:relative;overflow:hidden;width:${210 + bleed * 2}mm;height:${297 + bleed * 2}mm;background:#110d0b;color:#f3e6cc}
.wall{position:absolute;inset:0;width:100%;height:100%;z-index:0}
.sheet::after{content:"";position:absolute;inset:calc(var(--b) + 6mm);border:1mm solid #f0a83a;border-radius:3mm;box-shadow:inset 0 0 0 1.6mm #110d0b,inset 0 0 0 1.9mm rgba(240,168,58,.5);pointer-events:none;z-index:3}
.corner{position:absolute;z-index:4;width:5mm;height:5mm;background:#c4060c;box-shadow:0 0 0 .7mm #f0a83a;transform:rotate(45deg);border-radius:.5mm}
.c1{top:calc(var(--b) + 3.5mm);left:calc(var(--b) + 3.5mm)}.c2{top:calc(var(--b) + 3.5mm);right:calc(var(--b) + 3.5mm)}
.c3{bottom:calc(var(--b) + 3.5mm);left:calc(var(--b) + 3.5mm)}.c4{bottom:calc(var(--b) + 3.5mm);right:calc(var(--b) + 3.5mm)}
.inner{position:absolute;inset:calc(var(--b) + 13mm) calc(var(--b) + 13mm) calc(var(--b) + 12mm);display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;z-index:2}
.top{display:flex;flex-direction:column;align-items:center;width:100%}
.logo{width:25mm}
.kicker{display:flex;align-items:center;gap:4mm;margin-top:2mm;font-family:PPlay,serif;font-style:italic;font-weight:700;font-size:15pt;letter-spacing:1.6mm;text-transform:uppercase;color:#f8d596;white-space:nowrap}
.kicker::before,.kicker::after{content:"";width:18mm;height:.4mm;background:#f0a83a}
h1{margin-top:2mm;font-family:PPlay,serif;font-weight:800;font-size:50pt;line-height:.9;text-transform:uppercase;letter-spacing:-.6mm;color:#f5b54a;text-shadow:0 .6mm 0 #8a5512}
h1 span{display:block;font-size:64pt}
.tag{margin-top:3.5mm;font-family:Vibes,cursive;font-size:24pt;line-height:1.05;color:#f8d596}
.foods{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm;width:100%}
.food{position:relative;height:46mm;border:.7mm solid #f0a83a;border-radius:2.5mm;background:#110d0b;box-shadow:0 0 0 1.4mm #110d0b,0 0 0 1.7mm rgba(240,168,58,.45)}
.food img{display:block;width:100%;height:100%;object-fit:cover;border-radius:1.8mm}
.food .star{position:absolute;z-index:1;width:3.6mm;height:3.6mm;background:#c4060c;box-shadow:0 0 0 .5mm #f0a83a;transform:rotate(45deg);border-radius:.4mm}
.food .s1{top:-1.8mm;left:-1.8mm}.food .s2{top:-1.8mm;right:-1.8mm}.food .s3{bottom:-1.8mm;left:-1.8mm}.food .s4{bottom:-1.8mm;right:-1.8mm}
.panel{position:relative;display:grid;grid-template-columns:73mm minmax(0,1fr);align-items:center;gap:8mm;width:100%;padding:6mm 8mm;border:.7mm solid #f0a83a;border-radius:2.5mm;background:#211913;text-align:center}
.panel::before{content:"";position:absolute;inset:1.6mm;border:.3mm dashed rgba(240,168,58,.6);border-radius:1.6mm;pointer-events:none}
.panel .star{position:absolute;width:4.4mm;height:4.4mm;background:#c4060c;box-shadow:0 0 0 .6mm #f0a83a;transform:rotate(45deg);border-radius:.4mm}
.panel .s1{top:-2.2mm;left:-2.2mm}.panel .s2{top:-2.2mm;right:-2.2mm}.panel .s3{bottom:-2.2mm;left:-2.2mm}.panel .s4{bottom:-2.2mm;right:-2.2mm}
.code{position:relative;width:73mm;padding:6.5mm;background:#fff;border-radius:2mm;box-shadow:0 0 0 1.1mm #f0a83a}
.code img{display:block;width:100%;height:auto;aspect-ratio:1}
.side{display:flex;flex-direction:column;align-items:center;min-width:0}
.icons{display:flex;gap:4mm;color:#f0a83a}
.icons svg{width:10mm;height:10mm}
.panel h2{margin-top:2mm;font-family:PPlay,serif;font-weight:800;font-size:32pt;line-height:1;text-transform:uppercase;color:#f8d596;white-space:nowrap}
.savour{margin-top:2.5mm;font-family:Vibes,cursive;font-size:27pt;line-height:1.08;color:#f5b54a}
.cta{display:flex;align-items:center;justify-content:center;margin-top:5mm;padding:2.2mm 5mm;border-radius:9mm;background:linear-gradient(180deg,#fde4ab,#f0a83a 58%,#c9801f);color:#1a1411;font-family:PPlay,serif;font-weight:800;font-size:12pt;letter-spacing:.4mm;text-transform:uppercase;white-space:nowrap;box-shadow:0 0 0 .5mm #1a1411,0 0 0 .9mm #f0a83a}
.cta .dia{width:2.2mm;height:2.2mm;margin:0 2mm;box-shadow:0 0 0 .45mm #1a1411}
.url{margin-top:3mm;font-family:PPlay,serif;font-style:italic;font-weight:700;font-size:11pt;color:#f8d596}
.pfoot{width:150mm;padding-top:3.5mm;border-top:.3mm solid rgba(240,168,58,.4);display:flex;flex-direction:column;align-items:center;gap:1mm}
.great{font-family:PPlay,serif;font-style:italic;font-weight:700;font-size:15pt;color:#f3e6cc}
.soul{font-family:Vibes,cursive;font-size:26pt;line-height:1;color:#f5b54a}
.addr{margin-top:1mm;font-size:9pt;letter-spacing:.2mm;color:rgba(243,230,204,.8)}
`;

const stars = `<i class="star s1"></i><i class="star s2"></i><i class="star s3"></i><i class="star s4"></i>`;

const body = () => `<div class="sheet">
  ${wallpaper}
  <i class="corner c1"></i><i class="corner c2"></i><i class="corner c3"></i><i class="corner c4"></i>
  <div class="inner">
    <div class="top">
      <img class="logo" src="${logo}" alt="${restaurant.name} logo">
      <p class="kicker">Diago Spice Resto Bar</p>
      <h1>Special offers<span>await!</span></h1>
      <p class="tag">Your next favourite flavour is just a scan away!</p>
    </div>
    <div class="foods">${foods.map((name) => `<figure class="food">${stars}<img src="${photo(name)}" alt=""></figure>`).join("")}</div>
    <section class="panel">
      ${stars}
      <div class="code"><img src="${code}" alt="QR code for ${restaurant.websiteDisplay}${offersPath}"></div>
      <div class="side">
        <div class="icons">${plateIcon}${glassIcon}</div>
        <h2>Our offers</h2>
        <p class="savour">Crave the Spice.<br>Love the Taste!</p>
        <span class="cta">Scan <i class="dia"></i> Discover <i class="dia"></i> Savour</span>
        <span class="url">${restaurant.websiteDisplay}${offersPath.replace(/\/$/, "")}</span>
      </div>
    </section>
    <div class="pfoot">
      <p class="great">Great Food. Great Drinks. Great Offers.</p>
      <p class="soul">Desi Spice. Western Soul. Big Flavours!</p>
      <p class="addr">${restaurant.addressInline} &nbsp;<i class="dia" style="width:1.6mm;height:1.6mm"></i>&nbsp; ${restaurant.websiteDisplay}</p>
    </div>
  </div>
</div>`;

const html = (bleed: number) => htmlDocument(`${restaurant.name} Special Offers poster`, body(), "custom", css(bleed));

// 1. A4 for ordinary printers, 2. with 3 mm bleed for print shops.
renderPdf(html(0), `${base}.pdf`, process.env.POSTER_PREVIEW ? `${process.env.POSTER_PREVIEW}.html` : undefined);
renderPdf(html(3), `${base}-bleed.pdf`);

const mm = (value: number): number => (value / 25.4) * 72;
for (const [file, bleed, title] of [
  [`${base}.pdf`, 0, "A4"],
  [`${base}-bleed.pdf`, 3, "A4 with 3 mm bleed"],
] as const) {
  const doc = await PDFDocument.load(readFileSync(file));
  if (doc.getPageCount() !== 1) throw new Error(`${file} has ${doc.getPageCount()} pages, expected 1`);
  const page = doc.getPage(0);
  page.setBleedBox(0, 0, mm(210 + bleed * 2), mm(297 + bleed * 2));
  page.setTrimBox(mm(bleed), mm(bleed), mm(210), mm(297));
  doc.setTitle(`${restaurant.name}, Special Offers entrance poster (${title})`);
  doc.setAuthor(restaurant.name);
  writeFileSync(file, await doc.save());
}
console.log("Set TrimBox 210 x 297 mm, BleedBox 216 x 303 mm on the bleed file");

// 3. 300 DPI PNG: 210 x 297 mm at 96 px/in is 794 x 1123 CSS px; scale 3.125 gives 300 DPI.
renderPng(html(0), `${base}.png`, 794, 1123, 3.125);
execFileSync("sips", ["--cropToHeightWidth", "3508", "2480", "-s", "dpiWidth", "300", "-s", "dpiHeight", "300", `${base}.png`], { stdio: "pipe" });
execFileSync("sips", ["-Z", "900", "-s", "format", "jpeg", "-s", "formatOptions", "82", `${base}.png`, "--out", `${base}-preview.jpg`], { stdio: "pipe" });
console.log(`Wrote ${base}.png (2480 x 3508, 300 DPI) and the preview`);
