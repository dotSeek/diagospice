// Builds what search engines and social apps read without running the React site:
//   public/og/*.jpg            social preview images, 1200 x 630
//   public/menu/index.html     shareable delivery menu page that links to the PDF
//   public/sitemap.xml
// A PDF cannot carry Open Graph tags, so these pages are the links to share.
// Run with: npm run menu:pdf  (needs Google Chrome installed, or set CHROME_PATH)
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buffet, delivery, formatPrice, menuCategories } from "../src/data/menu.ts";
import type { MenuCategoryData, MenuItemData } from "../src/data/menu.ts";
import { restaurant } from "../src/data/restaurant.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const chrome = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const site = restaurant.websiteUrl;
const pub = (...parts: string[]): string => join(root, "public", ...parts);

const esc = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---- Fonts for the static pages
mkdirSync(pub("fonts"), { recursive: true });
for (const [from, to] of [
  ["@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2", "playfair.woff2"],
  ["@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2", "playfair-italic.woff2"],
  ["@fontsource-variable/bitter/files/bitter-latin-wght-normal.woff2", "bitter.woff2"],
]) {
  copyFileSync(join(root, "node_modules", from), pub("fonts", to));
}

// ---- Social preview images
const logo = `data:image/webp;base64,${readFileSync(pub("brand", "logo.webp")).toString("base64")}`;
const fontFile = (name: string): string => pathToFileURL(pub("fonts", name)).href;

const ogHtml = (word: string, line: string, size: number): string => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Playfair;src:url(${fontFile("playfair.woff2")});font-weight:400 900}
@font-face{font-family:Playfair;font-style:italic;src:url(${fontFile("playfair-italic.woff2")});font-weight:400 900}
@font-face{font-family:Bitter;src:url(${fontFile("bitter.woff2")});font-weight:100 900}
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#f9f8f2}
.frame{position:absolute;inset:24px;border:5px solid #c4060c;display:grid;grid-template-columns:400px 1fr;align-items:center;gap:32px;padding:0 56px 0 44px}
img{width:100%;display:block}
h1{margin:0;font:700 ${size}px/1 Playfair,serif;text-transform:uppercase;color:#c4060c;letter-spacing:-2px}
.rule{height:3px;background:rgba(196,6,12,.4);margin:24px 0}
p{margin:0;font:400 32px/1.3 Bitter,serif;color:#1a1a1a}
.italic{font:italic 700 34px/1.2 Playfair,serif;color:#c4060c;margin-bottom:10px}
</style></head><body><div class="frame"><img src="${logo}" alt=""><div>
<h1>${esc(word)}</h1><div class="rule"></div><p class="italic">${esc(line)}</p><p>${esc(restaurant.addressInline)}</p><p>${esc(restaurant.phoneDisplay)}</p>
</div></div></body></html>`;

const images: { file: string; word: string; line: string; size: number }[] = [
  { file: "diago-spice", word: "Diago Spice", line: "Frontier spirit. Serious spice.", size: 88 },
  { file: "menu", word: "Menu", line: "Delivery menu. Free within 3 miles", size: 150 },
];

const workDir = mkdtempSync(join(tmpdir(), "diago-og-"));
mkdirSync(pub("og"), { recursive: true });
for (const image of images) {
  const htmlPath = join(workDir, `${image.file}.html`);
  const pngPath = join(workDir, `${image.file}.png`);
  writeFileSync(htmlPath, ogHtml(image.word, image.line, image.size));
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--allow-file-access-from-files",
      "--window-size=1200,630",
      "--virtual-time-budget=3000",
      `--screenshot=${pngPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "pipe" },
  );
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", pngPath, "--out", pub("og", `${image.file}.jpg`)], {
    stdio: "pipe",
  });
}
rmSync(workDir, { recursive: true, force: true });

// ---- Shareable menu pages
const styles = `@font-face{font-family:Playfair;src:url(/fonts/playfair.woff2) format("woff2");font-weight:400 900;font-display:swap}
@font-face{font-family:Playfair;font-style:italic;src:url(/fonts/playfair-italic.woff2) format("woff2");font-weight:400 900;font-display:swap}
@font-face{font-family:Bitter;src:url(/fonts/bitter.woff2) format("woff2");font-weight:100 900;font-display:swap}
*{box-sizing:border-box}body{margin:0;background:#ddd8cc;color:#1a1a1a;font:400 18px/1.5 Bitter,Georgia,serif}
a{color:inherit}.sheet{max-width:1000px;margin:24px auto;padding:16px;background:#f9f8f2;box-shadow:-2px 2px 3px rgba(0,0,0,.4)}
.frame{border:3px solid #c4060c;border-radius:3px;padding:32px clamp(16px,4vw,48px)}
header{text-align:center}header img{width:150px;height:auto}
h1{margin:16px 0 8px;font:700 clamp(56px,13vw,120px)/1 Playfair,Georgia,serif;text-transform:uppercase;color:#c4060c}
.actions{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin:24px 0 16px}
.btn{display:inline-block;padding:12px 28px;border:1px solid #c4060c;font:italic 700 18px/1.2 Playfair,Georgia,serif;text-transform:uppercase;text-decoration:none;color:#c4060c}
.btn:hover,.btn.solid{background:#c4060c;color:#fff}.btn.solid:hover{background:#960408}
:focus-visible{outline:2px solid #c4060c;outline-offset:3px}
.cols{columns:2 320px;column-gap:48px}section{break-inside:avoid;margin-top:40px}
h2{margin:0 0 16px;text-align:center;font:italic 700 30px/1.15 Playfair,Georgia,serif;text-transform:uppercase;color:#c4060c}
ul{margin:0;padding:0;list-style:none}li{margin-bottom:12px}
.line{display:flex;align-items:baseline;gap:8px}.name{font:600 22px/1.2 Playfair,Georgia,serif;color:#c4060c}
.dots{flex:1;min-width:24px;border-bottom:2px dotted rgba(196,6,12,.4)}
.price{font:700 20px/1.2 Playfair,Georgia,serif;font-variant-numeric:lining-nums;white-space:nowrap}.note{display:block;font-size:15px}
.plain li{margin-bottom:2px}
footer{margin-top:48px;padding-top:24px;border-top:1px solid rgba(196,6,12,.4);text-align:center;font-size:16px}.legal{font-size:14px;margin-top:8px}`;

const itemRow = (item: MenuItemData): string =>
  `<li><div class="line"><span class="name">${esc(item.name)}</span><span class="dots"></span><span class="price">${formatPrice(item.price)}</span></div>${item.note ? `<span class="note">${esc(item.note)}</span>` : ""}</li>`;

const categoryHtml = (category: MenuCategoryData): string => {
  const rows =
    category.kind === "items"
      ? category.items.map(itemRow).join("")
      : category.deals
          .map((deal) => itemRow({ name: deal.name, price: deal.price, note: deal.includes.join(", ") }))
          .join("");
  return `<section><h2>${esc(category.label)}</h2><ul>${rows}</ul></section>`;
};

const buffetHtml = `<section><h2>Buffet menu</h2><p style="text-align:center">${esc(buffet.days)}, ${esc(buffet.hours)}. Adults ${formatPrice(buffet.adultPrice)}, ${esc(buffet.kidsNote.toLowerCase())} ${formatPrice(buffet.kidsPrice)}. For booking call <a href="${restaurant.phoneHref}">${esc(buffet.bookingPhone)}</a>.</p></section>
${buffet.groups.map((group) => `<section><h2>${esc(group.title)}</h2><ul class="plain">${group.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></section>`).join("")}`;

const deliveryHtml = `<section><h2>Delivery</h2><p style="text-align:center">${esc(delivery.howToOrder)} ${esc(delivery.freeDelivery)}. Minimum order ${delivery.minimumOrder}. <a href="${restaurant.phoneHref}">${esc(restaurant.phoneDisplay)}</a> | <a href="${restaurant.whatsappUrl}">WhatsApp</a></p></section>`;

const menuJsonLd = (name: string, url: string, categories: MenuCategoryData[]): string =>
  JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Menu",
    name,
    url,
    inLanguage: "en-GB",
    hasMenuSection: categories.map((category) => ({
      "@type": "MenuSection",
      name: category.label,
      hasMenuItem: (category.kind === "items" ? category.items : category.deals).map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        offers: { "@type": "Offer", price: item.price.toFixed(2), priceCurrency: "GBP" },
      })),
    })),
  }).replace(/</g, "\\u003c");

interface SharePage {
  folder: string;
  heading: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  pdfUrl: string;
  pdfFilename: string;
  body: string;
  jsonLd: string;
}

const pageHtml = (page: SharePage): string => {
  const url = `${site}/${page.folder}/`;
  const image = `${site}/og/${page.image}.jpg`;
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#F9F8F2">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(restaurant.name)}">
<meta property="og:locale" content="en_GB">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(page.imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${page.jsonLd}</script>
<style>${styles}</style>
</head>
<body>
<div class="sheet"><div class="frame">
<header>
<a href="/"><img src="/brand/logo-small.webp" alt="${esc(restaurant.name)} logo" width="240" height="274"></a>
<h1>${esc(page.heading)}</h1>
<div class="actions">
<a class="btn solid" href="${page.pdfUrl}" download="${page.pdfFilename}">Download PDF</a>
<a class="btn" href="${page.pdfUrl}">View PDF</a>
<a class="btn" href="/">Visit website</a>
</div>
</header>
<main class="cols">${page.body}</main>
<footer>
<p>${esc(restaurant.name)}, ${esc(restaurant.addressInline)}<br><a href="${restaurant.phoneHref}">${esc(restaurant.phoneDisplay)}</a></p>
<p class="legal">© ${new Date().getFullYear()} ${esc(restaurant.name)}. All rights reserved.</p>
</footer>
</div></div>
</body>
</html>
`;
};

const pages: SharePage[] = [
  {
    folder: "menu",
    heading: "Delivery menu",
    title: "Delivery Menu | Diago Spice, Clase, Swansea",
    description: `Diago Spice delivery menu with prices: curries, kottu, biriyani, burgers and meal deals. Free delivery within 3 miles, minimum order £20. Download the PDF.`,
    image: "menu",
    imageAlt: "Diago Spice logo beside the word Menu",
    pdfUrl: restaurant.menuPdfUrl,
    pdfFilename: restaurant.menuPdfFilename,
    body: deliveryHtml + menuCategories.map(categoryHtml).join("") + buffetHtml,
    jsonLd: menuJsonLd("Diago Spice delivery menu", `${site}/menu/`, menuCategories),
  },
];

for (const page of pages) {
  mkdirSync(pub(page.folder), { recursive: true });
  writeFileSync(pub(page.folder, "index.html"), pageHtml(page));
  console.log(`Wrote public/${page.folder}/index.html (title ${page.title.length}, description ${page.description.length})`);
}

// ---- Sitemap
const urls = ["/", "/menu/", restaurant.menuPdfUrl];
writeFileSync(
  pub("sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${site}${url}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
console.log("Wrote OG images and sitemap");
