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

// ---------- Entrance offers poster (A4, glass door or window) ----------
// The files are built by `npm run poster` into public/poster/. The poster has ONE QR code, for
// /offers/, which shows the live restaurant and bar offers in separate sections. It carries a link
// only, so it stays valid whatever offers are live; this panel shows what customers will see today.
const poster = "/poster/diago-spice-offers-poster";

const VENUE_NAME = { restaurant: "Restaurant", bar: "Bar" } as const;
type PosterVenue = keyof typeof VENUE_NAME;

const escape = (text: string) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Opens the offers editor on the given menu (handled by ContentEditor). */
const editOffers = (venue: PosterVenue) => {
  window.dispatchEvent(new CustomEvent("diago:edit-offers", { detail: venue }));
  document.querySelector("#content-admin")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

/** Loads the published menu behind a QR code and describes what a customer sees after scanning. */
const checkDestination = async (venue: PosterVenue) => {
  const res = await fetch(`/api/menu?name=${venue}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The ${venue} menu did not load (${res.status}).`);
  const doc = (await res.json()) as { categories: { kind: string; items?: unknown[]; deals?: unknown[] }[]; offers: { title: string; items: { name: string; offerPrice: number }[] }[] };
  const rows = doc.categories.reduce((sum, category) => sum + (category.items?.length ?? category.deals?.length ?? 0), 0);
  return { rows, offers: doc.offers };
};

export async function renderPosterAdmin(container: HTMLElement) {
  if (container.dataset.ready) return;
  container.dataset.ready = "1";
  const venues: PosterVenue[] = ["restaurant", "bar"];
  container.innerHTML = `<div class="poster-admin">
    <a class="poster-admin__preview" href="${poster}.pdf" target="_blank" rel="noopener" title="Open the A4 PDF">
      <img src="${poster}-preview.jpg" alt="Preview of the A4 Special Offers entrance poster" width="900" height="1273" loading="lazy">
    </a>
    <div class="poster-admin__side">
      <div class="qr-card__actions">
        <a class="btn btn--gold" href="${poster}.pdf" download>Download A4 PDF</a>
        <a class="btn btn--outline" href="${poster}-bleed.pdf" download>Download print shop PDF (3 mm bleed)</a>
        <a class="btn btn--outline" href="${poster}.png" download>Download PNG (300 DPI)</a>
      </div>
      <h3 class="poster-admin__h">What customers see after scanning</h3>
      <div class="poster-check">
        <div class="poster-check__head"><b>Poster QR code</b><a href="${restaurant.websiteUrl}/offers/" target="_blank" rel="noopener">${restaurant.websiteDisplay}/offers/</a></div>
        <ul class="poster-admin__checks">
          ${venues
            .map(
              (venue) => `<li data-venue="${venue}">
            <p class="poster-check__status" aria-live="polite"><b>${VENUE_NAME[venue]}:</b> checking...</p>
            <div class="poster-check__btns">
              <a class="mini-link" href="/${venue}-menu/" target="_blank" rel="noopener">Open ${VENUE_NAME[venue].toLowerCase()} menu</a>
              <button type="button" class="mini-link" data-edit="${venue}">Manage ${VENUE_NAME[venue].toLowerCase()} offers</button>
            </div>
          </li>`,
            )
            .join("")}
        </ul>
        <div class="poster-check__btns"><a class="btn btn--outline btn--small" href="/offers/" target="_blank" rel="noopener">Open the page the QR code opens</a></div>
      </div>
      <button type="button" class="btn btn--outline poster-admin__recheck">Check again</button>
      <p class="editor__hint">Printing: A4 portrait, no scaling ("Actual size"). Mount it inside the glass facing outward, away from strong reflections. The print shop file has 3 mm bleed with trim marks set in the PDF.</p>
    </div>
  </div>`;

  container.querySelectorAll<HTMLButtonElement>("[data-edit]").forEach((button) => button.addEventListener("click", () => editOffers(button.dataset.edit as PosterVenue)));

  const check = async () => {
    for (const venue of venues) {
      const status = container.querySelector<HTMLElement>(`[data-venue="${venue}"] .poster-check__status`)!;
      const label = `<b>${VENUE_NAME[venue]}:</b> `;
      status.className = "poster-check__status";
      status.innerHTML = `${label}checking...`;
      try {
        const { rows, offers } = await checkDestination(venue);
        status.classList.add("is-ok");
        status.innerHTML =
          label +
          (offers.length
            ? `${offers.length} offer${offers.length > 1 ? "s" : ""} live: ${offers
                .map((offer) => `<b>${escape(offer.title)}</b> (${offer.items.map((item) => `${escape(item.name)} £${item.offerPrice.toFixed(2)}`).join(", ")})`)
                .join(". ")}. Menu of ${rows} items.`
            : `no offers live, so customers are sent to the regular ${venue} menu (${rows} items).`);
      } catch (error) {
        status.classList.add("is-bad");
        status.innerHTML = label + escape((error as Error).message);
      }
    }
  };
  container.querySelector(".poster-admin__recheck")!.addEventListener("click", () => void check());
  window.addEventListener("diago:published", () => void check());
  void check();
}
