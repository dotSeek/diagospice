import QRCode from "qrcode";
import { restaurant } from "../data/restaurant";

// Table QR codes for the admin dashboard. They always point at the live site (never localhost),
// at fixed addresses, so printed codes keep working when menus or offers change.
const tables = [
  { id: "restaurant", title: "Restaurant menu", path: "/restaurant-menu/", line: "Scan to Explore Our Food Menu & Grand Opening Specials", order: "Please order with our staff" },
  { id: "bar", title: "Bar menu", path: "/bar-menu/", line: "Scan to Explore Our Drinks Menu & Opening Specials", order: "Please order at the bar" },
] as const;

const qrOptions = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#1a1411", light: "#ffffff" } };

const download = (href: string, filename: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
};

const printCard = (title: string, line: string, order: string, svg: string, url: string) => {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>${title} QR card</title>
<style>
@page{size:A6 portrait;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#fff}
.card{width:105mm;height:148mm;padding:8mm;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;
  background:#1a1411;color:#f3e6cc;font-family:Georgia,serif;border:2mm solid #f0a83a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.logo{width:28mm}
.resto{margin:0;font-size:7pt;letter-spacing:1.2mm;text-transform:uppercase;color:#f8d596}
h1{margin:0;font-size:17pt;letter-spacing:.4mm;text-transform:uppercase;color:#f0a83a}
.line{margin:0;font-style:italic;color:#f8d596;font-size:11pt}
.qr{width:62mm;background:#fff;padding:3mm;border-radius:2mm}
.qr svg{display:block;width:100%;height:auto}
.order{margin:0;font-size:10pt}
.foot{margin:0;font-size:7pt;opacity:.8}
</style></head><body><div class="card">
<img class="logo" src="${location.origin}/brand/logo.webp" alt="Diago Spice logo">
<p class="resto">Diago Spice Resto Bar</p><h1>${title}</h1><p class="line">${line}</p>
<div class="qr">${svg}</div>
<p class="order">${order}</p>
<p class="foot">${restaurant.name}, ${restaurant.addressInline}<br>${url}</p>
</div><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  win.document.close();
};

export async function renderQrAdmin(container: HTMLElement) {
  if (container.dataset.ready) return;
  container.dataset.ready = "1";
  for (const table of tables) {
    const url = `${restaurant.websiteUrl}${table.path}`;
    const svg = await QRCode.toString(url, { ...qrOptions, type: "svg" });
    const png = await QRCode.toDataURL(url, { ...qrOptions, width: 1200 });
    const card = document.createElement("article");
    card.className = "menu-card qr-card";
    card.innerHTML = `<h2>${table.title}</h2>
      <div class="qr-card__code">${svg}</div>
      <p class="qr-card__url">${url}</p>
      <div class="qr-card__actions">
        <a class="btn btn--gold" href="/qr/diago-spice-${table.id}-menu-qr.pdf" download>Download print PDF (A6 card + A4 poster)</a>
        <button class="btn btn--outline" type="button" data-act="print">Print table card</button>
        <button class="btn btn--outline" type="button" data-act="png">Download PNG</button>
        <button class="btn btn--outline" type="button" data-act="svg">Download SVG</button>
        <a class="btn btn--outline" href="${table.path}" target="_blank" rel="noopener">Open menu</a>
      </div>`;
    card.querySelector('[data-act="png"]')!.addEventListener("click", () => download(png, `diago-spice-${table.id}-menu-qr.png`));
    card.querySelector('[data-act="svg"]')!.addEventListener("click", () =>
      download(URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })), `diago-spice-${table.id}-menu-qr.svg`),
    );
    card.querySelector('[data-act="print"]')!.addEventListener("click", () => printCard(table.title, table.line, table.order, svg, url));
    container.append(card);
  }
}
