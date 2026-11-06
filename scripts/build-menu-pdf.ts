// Builds the delivery PDF menu in public/ from the same data the website uses.
// Run with: npm run menu:pdf  (needs Google Chrome installed, or set CHROME_PATH)
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { artworkSvg } from "../src/data/artwork.ts";
import type { ArtName } from "../src/data/artwork.ts";
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

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const title = (text: string): string =>
  `<h2 class="title"><i class="dia"></i><span>${escapeHtml(text)}</span><i class="dia"></i></h2>`;

const itemsHtml = (items: MenuItemData[]): string =>
  items
    .map(
      (item) => `<li class="item"><div class="line"><span class="name">${escapeHtml(item.name)}</span><span class="dots"></span><span class="price">${formatPrice(item.price)}</span></div>${item.note ? `<span class="note">${escapeHtml(item.note)}</span>` : ""}</li>`,
    )
    .join("");

let artCount = 0;
const art = (name: ArtName, size = "46mm"): string =>
  `<div class="art" style="width:${size}">${artworkSvg(name, `pdf${(artCount += 1)}`)}</div>`;

const itemBlock = (id: string): string => {
  const category = categoryById(id) as ItemCategory;
  return `<section class="block">${title(category.label)}<ul>${itemsHtml(category.items)}</ul></section>`;
};

const dealBlock = (id: string, drawing: ArtName): string => {
  const category = categoryById(id) as DealCategory;
  const deals = category.deals
    .map(
      (deal) => `<article class="deal"><h3>${escapeHtml(deal.name)}</h3><p>${escapeHtml(deal.includes.join(", "))}</p><p class="deal-price">${formatPrice(deal.price)}</p></article>`,
    )
    .join("");
  return `<section class="stroke"><div class="stroke-in">${title(category.label)}<div class="tr"><i class="dia"></i></div>${deals}${art(drawing, "42mm")}</div></section>`;
};

const footer = (page: number): string =>
  `<footer class="foot"><span>${restaurant.name}, ${restaurant.addressInline}</span><span>${restaurant.phoneDisplay}</span><span>${page}</span></footer>`;

const page = (pageNumber: number, body: string): string =>
  `<div class="page"><div class="border"><main>${body}</main>${footer(pageNumber)}</div></div>`;

const qrTile = `<figure class="qr"><img src="${qr}" alt="QR code"><figcaption>Scan for Facebook</figcaption></figure>`;

const styles = `
@font-face{font-family:Playfair;src:url(${fileUrl("node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2")});font-weight:400 900}
@font-face{font-family:Playfair;font-style:italic;src:url(${fileUrl("node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2")});font-weight:400 900}
@font-face{font-family:Bitter;src:url(${fileUrl("node_modules/@fontsource-variable/bitter/files/bitter-latin-wght-normal.woff2")});font-weight:100 900}
@page{size:A4;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0}
body{font-family:Bitter,serif;font-weight:400;color:#1a1a1a}
h1,h2,h3,p,ul,figure{margin:0;padding:0}ul{list-style:none}i{font-style:normal}
.page{width:210mm;height:297mm;overflow:hidden;page-break-after:always;position:relative;padding:7mm;background:#f9f8f2}
.page:last-child{page-break-after:auto}
.border{height:100%;border:.8mm solid #e39a2e;border-radius:3mm;box-shadow:inset 0 0 0 1.4mm #f9f8f2,inset 0 0 0 1.65mm rgba(227,154,46,.5);padding:9mm 10mm 6mm;display:flex;flex-direction:column}
main{flex:1;min-height:0}
.dia{display:inline-block;flex:none;width:2.4mm;height:2.4mm;background:#c4060c;box-shadow:0 0 0 .5mm #e39a2e;border-radius:.3mm;transform:rotate(45deg)}
.title{display:flex;align-items:center;justify-content:center;gap:6mm;font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:22pt;line-height:1.1;text-transform:uppercase;color:#c4060c;text-align:center;margin-bottom:6mm}
.cols{display:grid;grid-template-columns:1fr .4mm 1fr;gap:0 7mm;height:100%}
.vline{background:rgba(227,154,46,.55)}
.block{margin-bottom:9mm;break-inside:avoid}
.item{margin-bottom:3.1mm}
.name{font-family:Playfair,serif;font-weight:600;font-size:13pt;line-height:1.2;color:#c4060c}
.dots{flex:1;min-width:6mm;border-bottom:.4mm dotted rgba(227,154,46,.7);transform:translateY(-.7mm)}
.line{display:flex;align-items:baseline;gap:1.6mm}
.price{font-family:Playfair,serif;font-weight:700;font-size:12pt;color:#a8650f;white-space:nowrap}
.note{display:block;font-size:9pt;line-height:1.2}
.foot{display:flex;justify-content:space-between;gap:6mm;padding-top:3mm;border-top:.25mm solid rgba(196,6,12,.4);font-size:8pt}
.stroke{border:.25mm solid rgba(196,6,12,.4);padding:1.6mm;margin-bottom:9mm}
.stroke-in{border:.25mm solid rgba(196,6,12,.4);background:rgba(202,191,181,.22);padding:8mm 6mm 3mm}
.stroke .title{margin-bottom:3mm}
.tr{display:flex;align-items:center;justify-content:center;gap:3mm;margin-bottom:6mm}
.tr::before,.tr::after{content:"";width:14mm;height:.4mm;background:#e39a2e}
.deal{text-align:center;margin-bottom:6mm}
.deal h3{font-family:Playfair,serif;font-size:14.5pt;font-weight:600;line-height:1.2;color:#c4060c;margin-bottom:.6mm}
.deal p{font-size:10pt;line-height:1.35}
.deal-price{margin-top:.8mm;font-family:Playfair,serif;font-weight:700;color:#1a1a1a}
.roomy .stroke-in{padding:9mm 6mm 2mm}.roomy .stroke{margin-bottom:0}.roomy .deal{margin-bottom:9mm}.roomy .deal h3{font-size:16pt;margin-bottom:1mm}.roomy .deal p{font-size:11pt}.roomy .deal-price{margin-top:1mm!important;font-size:15pt}.roomy .title{margin-bottom:4mm;font-size:20pt}
.price,.deal-price,.bp b,.cover-info{font-variant-numeric:lining-nums}
.art{margin:2mm auto 0;color:#1a1a1a}.art svg{display:block;width:100%;height:auto}.stroke-in{--art-bg:#f1eee8}
.cover{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center}
.cover-logo{width:118mm;margin-top:6mm}
.word{display:flex;align-items:center;gap:6mm;width:100%}
.word hr{flex:1;border:0;height:.4mm;background:#e39a2e;margin:0}
.word h1{white-space:nowrap;font-family:Playfair,serif;font-weight:700;font-size:92pt;line-height:.95;text-transform:uppercase;color:#c4060c}
.cover-info{font-size:12pt;line-height:1.5}
.cover-kicker{font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:20pt;text-transform:uppercase;color:#c9801f;margin-top:-4mm}
.cover-foot{display:flex;align-items:center;justify-content:center;gap:9mm;margin-bottom:1mm;text-align:left}
.qr{background:#fff;padding:2.5mm;border:.25mm solid rgba(196,6,12,.4);width:34mm;text-align:center}
.qr img{display:block;width:100%}
.qr figcaption{font-size:7.5pt;color:#1a1a1a;margin-top:1mm;font-weight:400}
.big{font-family:Playfair,serif;font-weight:700;font-size:56pt;line-height:1;text-transform:uppercase;color:#c4060c;margin-bottom:5mm}
.when{display:flex;align-items:center;justify-content:space-between;gap:6mm;background:linear-gradient(135deg,#d40b12,#9c0509);border-bottom:1mm solid #e39a2e;border-radius:2mm;color:#fff;padding:4.5mm 6mm;margin-bottom:6mm}
.when strong{display:block;font-family:Playfair,serif;font-style:italic;font-weight:700;font-size:14pt;text-transform:uppercase}
.when p{font-size:10pt;line-height:1.35;font-weight:400}
.bp{white-space:nowrap;font-size:8.5pt;text-align:center;font-weight:400}
.bp b{display:block;font-family:Playfair,serif;font-size:19pt;line-height:1.1}
.bgrid{columns:3;column-gap:7mm}
.bgroup{break-inside:avoid;margin-bottom:5mm}
.bgroup h3{font-family:Playfair,serif;font-style:italic;font-size:12pt;font-weight:700;text-transform:uppercase;color:#c4060c;margin-bottom:1.2mm}
.bgroup li{font-size:10pt;line-height:1.42}
.des{display:flex;justify-content:space-between;gap:2mm}
.closing{display:flex;align-items:center;justify-content:space-between;gap:8mm;border-top:.25mm solid rgba(196,6,12,.4);padding-top:4mm}
.closing img.small{width:21mm}
.closing-info{flex:1;font-size:10pt;line-height:1.45}
.closing-info strong{font-family:Playfair,serif;font-weight:700;font-size:15pt;display:block;color:#c4060c}
`;

const document = (pageTitle: string, body: string): string =>
  `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>${pageTitle}</title><style>${styles}</style></head><body>${body}</body></html>`;

const foodMenu = document(`${restaurant.name} Menu | ${restaurant.addressInline}`, `

<div class="page"><div class="border"><div class="cover">
  <img class="cover-logo" src="${logo}" alt="${restaurant.name} logo">
  <div class="word"><hr><h1>Menu</h1><hr></div>
  <p class="cover-kicker">For delivery</p>
  <p class="cover-info">${delivery.howToOrder}<br>${delivery.freeDelivery}. Minimum order ${delivery.minimumOrder}.</p>
  <p class="cover-info">${restaurant.addressInline}<br>${restaurant.phoneDisplay} | ${restaurant.websiteDisplay}</p>
  <div class="cover-foot">
    ${qrTile}
    <p class="cover-info">Buffet: ${buffet.days}<br>${buffet.hours}<br>Facebook: ${restaurant.facebookName}</p>
  </div>
</div></div></div>

${page(2, `<div class="cols"><div>${itemBlock("starters")}${itemBlock("nan")}${art("chilli","25mm")}</div><div class="vline"></div><div>${itemBlock("mains")}${itemBlock("chips")}${art("fries","38mm")}</div></div>`)}

${page(3, `<div class="cols"><div>${itemBlock("specials")}${itemBlock("burgers")}</div><div class="vline"></div><div>${itemBlock("rice")}${itemBlock("desserts")}${art("cake")}</div></div>`)}

${page(4, `<div class="cols roomy"><div>${dealBlock("meal-deals","burger")}</div><div class="vline"></div><div>${dealBlock("rice-curry-deals","bowl")}</div></div>`)}

<div class="page"><div class="border"><main>
  <h2 class="big">Buffet menu</h2>
  <div class="when">
    <p><strong>${buffet.days}</strong>${buffet.hours}<br>For booking call ${buffet.bookingPhone}</p>
    <div class="bp"><b>${formatPrice(buffet.adultPrice)}</b>Adults</div>
    <div class="bp"><b>${formatPrice(buffet.kidsPrice)}</b>${buffet.kidsNote}</div>
  </div>
  <div class="bgrid">
    ${buffet.groups.map((group) => `<div class="bgroup"><h3>${escapeHtml(group.title)}</h3><ul>${group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`).join("")}
  </div>
  ${art("cloche","52mm")}
</main>
<div class="closing">
  <div class="closing-info"><strong>${restaurant.name}</strong>${restaurant.addressInline}<br>${restaurant.phoneDisplay} | ${restaurant.websiteDisplay}<br>Facebook: ${restaurant.facebookName}</div>
  ${qrTile}
</div>
</div></div>
`);

const workDir = mkdtempSync(join(tmpdir(), "diago-menu-"));

const renderPdf = (markup: string, filename: string): void => {
  const htmlPath = join(workDir, `${filename}.html`);
  const outPath = join(root, "public", filename);
  writeFileSync(htmlPath, markup);
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--allow-file-access-from-files",
      "--virtual-time-budget=4000",
      `--print-to-pdf=${outPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "pipe" },
  );
  console.log(`Wrote ${outPath}`);
};

renderPdf(foodMenu, "diago-spice-menu.pdf");
rmSync(workDir, { recursive: true, force: true });
