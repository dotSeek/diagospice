import { useCallback, useEffect, useMemo, useState } from "react";
import { OFFER_LABEL, PENDING, VENUES, VENUE_TITLE, menuPrices, offerProblems } from "../data/content";
import type { MenuDoc, Offer, OfferItem, Venue } from "../data/content";
import { formatPrice } from "../data/menu";

// Admin menu and offer editor. Changes are saved as a DRAFT; customers keep seeing the
// published menu until "Publish" is pressed. The server re-checks every rule on save and publish.

interface Loaded {
  storage: "redis" | "file" | "read-only";
  hasDraft: boolean;
  publishedUpdated: string;
  doc: MenuDoc;
}

const previewUrl: Record<Venue, string> = {
  delivery: "/?preview=1#menu",
  restaurant: "/restaurant-menu/?preview=1",
  bar: "/bar-menu/?preview=1",
};

const api = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, { credentials: "same-origin", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error ?? "Request failed."), { problems: body.problems as string[] | undefined });
  return body;
};

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function ContentEditor() {
  const [venue, setVenue] = useState<Venue>("restaurant");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [doc, setDoc] = useState<MenuDoc | null>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string; problems?: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (target: Venue) => {
    setMessage(null);
    const data = (await api(`/api/staff/content?venue=${target}`)) as Loaded;
    setLoaded(data);
    setDoc(structuredClone(data.doc));
    setDirty(false);
  }, []);

  useEffect(() => {
    load(venue).catch((error) => setMessage({ kind: "error", text: error.message }));
  }, [venue, load]);

  const change = (next: MenuDoc) => {
    setDoc(next);
    setDirty(true);
  };

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await load(venue);
      setMessage({ kind: "ok", text: label });
    } catch (error) {
      const err = error as Error & { problems?: string[] };
      setMessage({ kind: "error", text: err.message, problems: err.problems });
    } finally {
      setBusy(false);
    }
  };

  const save = () => run("Draft saved. Preview it, then publish when ready.", () => api(`/api/staff/content?venue=${venue}`, { method: "PUT", body: JSON.stringify(doc) }));
  const publish = () => {
    if (dirty) return setMessage({ kind: "error", text: "Save the draft first, then preview it." });
    if (!window.confirm(`Publish the ${VENUE_TITLE[venue].toLowerCase()}? Customers will see it straight away.`)) return;
    void run("Published. The QR menu and website now show this version.", () => api(`/api/staff/publish?venue=${venue}`, { method: "POST" }));
  };
  const discard = () => {
    if (!window.confirm("Throw away the draft and go back to the published menu?")) return;
    void run("Draft discarded.", () => api(`/api/staff/discard?venue=${venue}`, { method: "POST" }));
  };

  const switchVenue = (next: Venue) => {
    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
    setVenue(next);
  };

  const prices = useMemo(() => (doc ? menuPrices(doc) : new Map<string, number>()), [doc]);

  if (!doc || !loaded) return <p className="card__lead">{message?.text ?? "Loading menus..."}</p>;

  const setPrice = (categoryIndex: number, rowIndex: number, value: string) => {
    const next = structuredClone(doc);
    const category = next.categories[categoryIndex];
    const price = Math.round(parseFloat(value) * 100) / 100;
    if (category.kind === "items") category.items[rowIndex].price = price;
    else category.deals[rowIndex].price = price;
    // keep offer regular prices in step with the menu
    for (const offer of next.offers) for (const item of offer.items) if (item.name === (category.kind === "items" ? category.items[rowIndex].name : category.deals[rowIndex].name)) item.originalPrice = price;
    change(next);
  };

  const setOffer = (index: number, patch: Partial<Offer>) => {
    const next = structuredClone(doc);
    next.offers[index] = { ...next.offers[index], ...patch };
    change(next);
  };

  const addOffer = () => {
    const next = structuredClone(doc);
    next.offers.push({
      id: `offer-${Date.now()}`,
      title: venue === "bar" ? "Bar Opening Special" : venue === "restaurant" ? "Opening Special" : "First Order Special",
      venue,
      audience: venue === "bar" ? "Bar customers" : venue === "restaurant" ? "Dine in customers" : "New delivery customers",
      description: "",
      value: "",
      items: [],
      conditions: venue === "restaurant" ? ["Dine in only"] : venue === "bar" ? ["Bar only"] : [],
      active: false,
      source: "",
    });
    change(next);
  };

  const removeOffer = (index: number) => {
    if (!window.confirm("Remove this offer from the draft?")) return;
    const next = structuredClone(doc);
    next.offers.splice(index, 1);
    change(next);
  };

  return (
    <div className="editor">
      <div className="editor__tabs" role="tablist" aria-label="Menus">
        {VENUES.map((entry) => (
          <button key={entry} type="button" role="tab" aria-selected={entry === venue} className={`btn ${entry === venue ? "btn--gold" : "btn--outline"}`} onClick={() => switchVenue(entry)}>
            {VENUE_TITLE[entry]}
          </button>
        ))}
      </div>

      {loaded.storage === "read-only" ? (
        <p className="editor__warn">Storage is not connected yet, so changes cannot be saved. Add Upstash Redis to the Vercel project (see docs/diago-website-implementation-report.md).</p>
      ) : null}
      <p className="editor__status">
        Published {when(loaded.publishedUpdated)}. {loaded.hasDraft ? <b>A draft is waiting to be published.</b> : "No draft."} {dirty ? <b>Unsaved changes.</b> : null}
      </p>

      {message ? (
        <div className={`editor__msg editor__msg--${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>
          <p>{message.text}</p>
          {message.problems?.length ? (
            <ul>
              {message.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="editor__actions">
        <button type="button" className="btn btn--gold" disabled={busy || !dirty} onClick={save}>
          Save draft
        </button>
        <a className="btn btn--outline" href={previewUrl[venue]} target="_blank" rel="noopener">
          Preview draft
        </a>
        <button type="button" className="btn btn--red" disabled={busy || !loaded.hasDraft || dirty} onClick={publish}>
          Publish
        </button>
        <button type="button" className="btn btn--outline" disabled={busy || !loaded.hasDraft} onClick={discard}>
          Discard draft
        </button>
      </div>

      <h3 className="editor__h">{venue === "delivery" ? "First order and delivery offers" : venue === "bar" ? "Bar opening offers" : "Restaurant opening offers"}</h3>
      <p className="editor__hint">
        Only fill in offers the business has confirmed. An offer shows to customers only when it is switched on, every field is filled, each item's offer price is below its menu price, and it is in date. {OFFER_LABEL[venue]} offers only ever appear on the {VENUE_TITLE[venue].toLowerCase()}.
      </p>
      {doc.offers.map((offer, index) => {
        const problems = offerProblems(offer, doc);
        return (
          <fieldset className="offer-edit" key={offer.id}>
            <legend>
              {offer.title || "Untitled offer"} {offer.active ? (problems.length ? <span className="tag tag--warn">On, but hidden</span> : <span className="tag tag--live">Live when published</span>) : <span className="tag">Off</span>}
            </legend>
            <label className="row">
              <input type="checkbox" checked={offer.active} onChange={(event) => setOffer(index, { active: event.target.checked })} /> Show this offer to customers
            </label>
            <label>
              Title
              <input value={offer.title} onChange={(event) => setOffer(index, { title: event.target.value })} />
            </label>
            <label>
              Offer (what the customer gets)
              <input value={offer.value === PENDING ? "" : offer.value} placeholder={PENDING} onChange={(event) => setOffer(index, { value: event.target.value })} />
            </label>
            <label>
              Description
              <textarea rows={2} value={offer.description === PENDING ? "" : offer.description} placeholder={PENDING} onChange={(event) => setOffer(index, { description: event.target.value })} />
            </label>
            <div className="offer-items">
              <p>Discounted {venue === "bar" ? "drinks and items" : "dishes"} {venue === "delivery" ? "(optional for whole order offers)" : ""}</p>
              {offer.items.map((item, itemIndex) => (
                <div className="offer-item" key={`${item.name}-${itemIndex}`}>
                  <select
                    value={item.name}
                    aria-label="Menu item"
                    onChange={(event) => {
                      const items = [...offer.items];
                      items[itemIndex] = { ...item, name: event.target.value, originalPrice: prices.get(event.target.value) ?? 0 };
                      setOffer(index, { items });
                    }}
                  >
                    {[...prices.keys()].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <span className="offer-item__was">was {formatPrice(item.originalPrice)}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    aria-label={`Offer price for ${item.name}`}
                    value={Number.isFinite(item.offerPrice) ? item.offerPrice : ""}
                    onChange={(event) => {
                      const items = [...offer.items];
                      items[itemIndex] = { ...item, offerPrice: Math.round(parseFloat(event.target.value) * 100) / 100 };
                      setOffer(index, { items });
                    }}
                  />
                  <button type="button" className="btn btn--outline btn--small" onClick={() => setOffer(index, { items: offer.items.filter((_, i) => i !== itemIndex) })}>
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn--outline btn--small"
                onClick={() => {
                  const first = [...prices.keys()][0];
                  const item: OfferItem = { name: first, originalPrice: prices.get(first) ?? 0, offerPrice: NaN };
                  setOffer(index, { items: [...offer.items, item] });
                }}
              >
                Add item
              </button>
            </div>
            <label>
              Conditions (one per line)
              <textarea
                rows={3}
                value={offer.conditions.filter((c) => c !== PENDING).join("\n")}
                placeholder={PENDING}
                onChange={(event) => setOffer(index, { conditions: event.target.value.split("\n").map((c) => c.trim()).filter(Boolean) })}
              />
            </label>
            <div className="dates">
              <label>
                Starts (optional)
                <input type="date" value={offer.starts ?? ""} onChange={(event) => setOffer(index, { starts: event.target.value || undefined })} />
              </label>
              <label>
                Ends (optional)
                <input type="date" value={offer.expires ?? ""} onChange={(event) => setOffer(index, { expires: event.target.value || undefined })} />
              </label>
            </div>
            <label>
              Confirmed by (source)
              <input value={offer.source === PENDING ? "" : offer.source} placeholder="For example: Owner, WhatsApp 6 Nov 2026" onChange={(event) => setOffer(index, { source: event.target.value })} />
            </label>
            {problems.length ? (
              <ul className="offer-problems" aria-label="Why this offer is hidden">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            ) : null}
            <button type="button" className="btn btn--outline btn--small" onClick={() => removeOffer(index)}>
              Remove offer
            </button>
          </fieldset>
        );
      })}
      <button type="button" className="btn btn--outline" onClick={addOffer}>
        Add offer
      </button>

      <h3 className="editor__h">{VENUE_TITLE[venue]} prices</h3>
      {doc.categories.map((category, categoryIndex) => (
        <details className="price-group" key={category.id}>
          <summary>
            {category.label} ({category.kind === "items" ? category.items.length : category.deals.length})
          </summary>
          {(category.kind === "items" ? category.items : category.deals).map((row, rowIndex) => (
            <label className="price-row" key={row.name}>
              <span>{row.name}</span>
              <span className="price-row__input">
                £
                <input type="number" step="0.01" min="0" value={row.price} onChange={(event) => setPrice(categoryIndex, rowIndex, event.target.value)} aria-label={`Price for ${row.name}`} />
              </span>
            </label>
          ))}
        </details>
      ))}
      <p className="editor__hint">The printed PDFs do not update by themselves. After publishing new prices, ask for the PDFs to be regenerated.</p>
    </div>
  );
}
