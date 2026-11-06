import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OFFER_LABEL, PENDING, VENUES, VENUE_TITLE, menuPrices, offerProblems } from "../data/content";
import type { BuffetInfo, MenuDoc, Offer, Venue } from "../data/content";
import { formatPrice } from "../data/menu";

// Admin menu and offer editor. Every change is a DRAFT until "Publish" is pressed; customers keep
// seeing the published menu. The server re-checks every rule on save and on publish.

export interface Loaded {
  storage: "redis" | "file" | "read-only";
  hasDraft: boolean;
  publishedUpdated: string;
  doc: MenuDoc;
}

type Msg = { kind: "ok" | "error"; text: string; problems?: string[] } | null;

export const previewUrl: Record<Venue, string> = {
  delivery: "/?preview=1#menu",
  restaurant: "/restaurant-menu/?preview=1",
  bar: "/bar-menu/?preview=1",
  buffet: "/restaurant-menu/?preview=1#buffet",
};

// One tap conditions per venue. Staff can still type their own.
const QUICK_CONDITIONS: Record<Venue, string[]> = {
  delivery: ["First delivery order only", "Delivery orders only", "One offer per order"],
  restaurant: ["Dine in only", "One offer per table", "Not with other offers"],
  bar: ["Bar only", "One offer per customer", "Not with other offers"],
  buffet: ["Buffet only", "Dine in only", "Not with other offers"],
};

export const NEW_TITLE: Record<Venue, string> = { delivery: "First Order Special", restaurant: "Opening Special", bar: "Bar Opening Special", buffet: "Buffet Special" };
export const AUDIENCE: Record<Venue, string> = { delivery: "New delivery customers", restaurant: "Dine in customers", bar: "Bar customers", buffet: "Buffet guests" };
export const DEFAULT_CONDITION: Record<Venue, string> = { delivery: "Delivery orders only", restaurant: "Dine in only", bar: "Bar only", buffet: "Buffet only" };
export const OFFERS_HEADING: Record<Venue, string> = { delivery: "Delivery offers", restaurant: "Restaurant opening offers", bar: "Bar opening offers", buffet: "Buffet Special offers" };

export const api = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, { credentials: "same-origin", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error ?? "Something went wrong."), { problems: body.problems as string[] | undefined });
  return body;
};

export const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const money = (value: string) => Math.round(parseFloat(value) * 100) / 100;

/** Clears "waiting for confirmation" placeholders so nothing hides inside a field the admin cannot see. */
export const editable = <T extends Pick<MenuDoc, "offers">>(doc: T): T => {
  const copy = structuredClone(doc);
  for (const offer of copy.offers) {
    if (offer.value === PENDING) offer.value = "";
    if (offer.description === PENDING) offer.description = "";
    if (offer.source === PENDING) offer.source = "";
    offer.conditions = offer.conditions.filter((condition) => condition !== PENDING);
  }
  return copy;
};

export function ContentEditor() {
  const [venue, setVenue] = useState<Venue>("restaurant");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [doc, setDoc] = useState<MenuDoc | null>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async (target: Venue) => {
    const data = (await api(`/api/staff/content?venue=${target}`)) as Loaded;
    setLoaded(data);
    setDoc(editable(data.doc));
    setDirty(false);
  }, []);

  useEffect(() => {
    setMessage(null);
    setEditing(null);
    load(venue).catch((error) => setMessage({ kind: "error", text: error.message }));
  }, [venue, load]);

  // The entrance poster panel asks to open a menu's offers ("Manage restaurant offers").
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    const open = (event: Event) => {
      const target = (event as CustomEvent<Venue>).detail;
      if (!VENUES.includes(target)) return;
      if (dirtyRef.current && !window.confirm("You have unsaved changes. Leave without saving?")) return;
      setVenue(target);
    };
    window.addEventListener("diago:edit-offers", open);
    return () => window.removeEventListener("diago:edit-offers", open);
  }, []);

  const prices = useMemo(() => (doc ? menuPrices(doc) : new Map<string, number>()), [doc]);

  if (!doc || !loaded) return <p className="card__lead">{message?.text ?? "Loading menus..."}</p>;

  const change = (next: MenuDoc) => {
    setDoc(next);
    setDirty(true);
    setMessage(null);
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

  const save = () => run("Draft saved. Preview it, then publish when you are happy.", () => api(`/api/staff/content?venue=${venue}`, { method: "PUT", body: JSON.stringify(doc) }));
  const publish = () => {
    if (!window.confirm(`Publish the ${VENUE_TITLE[venue].toLowerCase()} now? Customers will see it within a minute.`)) return;
    void run("Published. The website and QR menu now show this version.", async () => {
      await api(`/api/staff/publish?venue=${venue}`, { method: "POST" });
      window.dispatchEvent(new CustomEvent("diago:published", { detail: venue }));
    });
  };
  const discard = () => {
    if (!window.confirm("Throw away the draft and go back to the published menu?")) return;
    void run("Draft discarded.", () => api(`/api/staff/discard?venue=${venue}`, { method: "POST" }));
  };
  const switchVenue = (next: Venue) => {
    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
    setVenue(next);
  };

  const updateOffer = (id: string, patch: Partial<Offer>) =>
    change({ ...doc, offers: doc.offers.map((offer) => (offer.id === id ? { ...offer, ...patch } : offer)) });

  const addOffer = () => {
    const id = `offer-${Date.now()}`;
    change({
      ...doc,
      offers: [
        ...doc.offers,
        { id, title: NEW_TITLE[venue], venue, audience: AUDIENCE[venue], description: "", value: "", items: [], conditions: [DEFAULT_CONDITION[venue]], active: false, source: "" },
      ],
    });
    setEditing(id);
  };

  const removeOffer = (offer: Offer) => {
    if (!window.confirm(`Remove "${offer.title}"? It disappears for customers once you save and publish.`)) return;
    change({ ...doc, offers: doc.offers.filter((entry) => entry.id !== offer.id) });
    if (editing === offer.id) setEditing(null);
  };

  /** Menu edits (prices, names, new or removed items) also keep every offer in step. */
  const changeMenu = (categories: MenuDoc["categories"], renamed?: { from: string; to: string }, removed?: string) => {
    const next = { ...structuredClone(doc), categories };
    const latest = menuPrices(next);
    for (const offer of next.offers) {
      if (removed) offer.items = offer.items.filter((item) => item.name !== removed);
      for (const item of offer.items) {
        if (renamed && item.name === renamed.from) item.name = renamed.to;
        const price = latest.get(item.name);
        if (price !== undefined) item.originalPrice = price;
      }
    }
    change(next);
  };

  /** Buffet price changes keep each buffet offer's regular price in step. */
  const changeBuffet = (buffet: BuffetInfo) => {
    const next = { ...structuredClone(doc), buffet };
    const latest = menuPrices(next);
    for (const offer of next.offers) for (const item of offer.items) item.originalPrice = latest.get(item.name) ?? item.originalPrice;
    change(next);
  };

  const state = dirty ? "unsaved" : loaded.hasDraft ? "draft" : "live";

  return (
    <div className="editor">
      <div className="editor__tabs" role="tablist" aria-label="Menus">
        {VENUES.map((entry) => (
          <button key={entry} type="button" role="tab" aria-selected={entry === venue} className={`tabbtn${entry === venue ? " is-on" : ""}`} onClick={() => switchVenue(entry)}>
            {VENUE_TITLE[entry]}
          </button>
        ))}
      </div>

      {loaded.storage === "read-only" ? (
        <p className="editor__warn">Saving is switched off until Upstash Redis is connected to the Vercel project. You can look around, but changes cannot be saved yet.</p>
      ) : null}

      {/* Offers */}
      <section className="ed-section" aria-labelledby="offers-h">
        <div className="ed-section__head">
          <h3 id="offers-h">{OFFERS_HEADING[venue]}</h3>
          <button type="button" className="btn btn--gold btn--small" onClick={addOffer}>
            + Add new offer
          </button>
        </div>
        <p className="editor__hint">
          These only ever appear on the {VENUE_TITLE[venue].toLowerCase()}, marked "{OFFER_LABEL[venue]}".{" "}
          {venue === "buffet" ? "Pick the adult or kids buffet price and enter the offer price. Restaurant menu prices never change. " : ""}
          Only enter offers the business has confirmed.
        </p>
        {doc.offers.length === 0 ? <p className="ed-empty">No offers yet. Press "Add new offer" to create one.</p> : null}
        <div className="offer-cards">
          {doc.offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              doc={doc}
              prices={prices}
              open={editing === offer.id}
              onToggleOpen={() => setEditing(editing === offer.id ? null : offer.id)}
              onChange={(patch) => updateOffer(offer.id, patch)}
              onRemove={() => removeOffer(offer)}
            />
          ))}
        </div>
      </section>

      {/* Buffet Special Menu: its own prices, plus dishes picked from the restaurant menu */}
      {venue === "buffet" && doc.buffet ? <BuffetEditor buffet={doc.buffet} onChange={changeBuffet} /> : null}

      {/* Prices (the buffet has no menu items of its own) */}
      {venue === "buffet" ? null : <MenuItemsEditor doc={doc} onChange={changeMenu} />}
      {venue === "restaurant" ? <p className="editor__hint">The weekend buffet has its own tab, Buffet Special Menu, with its own prices and offers.</p> : null}

      {/* Save and publish bar */}
      <div className={`ed-bar ed-bar--${state}`} role="region" aria-label="Save and publish">
        <p className="ed-bar__state">
          {state === "unsaved" ? (
            <>
              <b>Unsaved changes.</b> Save a draft to keep them.
            </>
          ) : state === "draft" ? (
            <>
              <b>Draft saved, not live yet.</b> Preview it, then publish.
            </>
          ) : (
            <>
              <b>Up to date.</b> Customers see the version published {when(loaded.publishedUpdated)}.
            </>
          )}
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
          <button type="button" className="btn btn--gold" disabled={busy || !dirty || loaded.storage === "read-only"} onClick={save}>
            Save draft
          </button>
          <a className={`btn btn--outline${!loaded.hasDraft || dirty ? " is-disabled" : ""}`} href={previewUrl[venue]} target="_blank" rel="noopener" aria-disabled={!loaded.hasDraft || dirty}>
            Preview draft
          </a>
          <button type="button" className="btn btn--red" disabled={busy || !loaded.hasDraft || dirty} onClick={publish}>
            Publish
          </button>
          <button type="button" className="btn btn--outline" disabled={busy || !loaded.hasDraft} onClick={discard}>
            Discard draft
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- one offer: summary card that opens into a guided form ----------

export function OfferCard({
  offer,
  doc,
  prices,
  open,
  onToggleOpen,
  onChange,
  onRemove,
}: {
  offer: Offer;
  doc: MenuDoc;
  prices: Map<string, number>;
  open: boolean;
  onToggleOpen: () => void;
  onChange: (patch: Partial<Offer>) => void;
  onRemove: () => void;
}) {
  const problems = offerProblems(offer, doc);
  const ready = problems.length === 0;
  const status = !offer.active ? { cls: "off", text: "Hidden" } : ready ? { cls: "live", text: "Shows when published" } : { cls: "warn", text: "Needs details" };

  return (
    <article className={`offer-card${open ? " is-open" : ""}`}>
      <header className="offer-card__head">
        <div>
          <span className={`pill pill--${status.cls}`}>{status.text}</span>
          <h4>{offer.title || "Untitled offer"}</h4>
          <p className="offer-card__sum">
            {offer.value || "No offer text yet"}
            {offer.items.length ? ` · ${offer.items.map((item) => `${item.name} ${formatPrice(item.offerPrice || 0)}`).join(", ")}` : ""}
          </p>
        </div>
        <div className="offer-card__btns">
          <label className="switch" title="Show this offer to customers">
            <input type="checkbox" checked={offer.active} onChange={(event) => onChange({ active: event.target.checked })} aria-label={`Show ${offer.title} to customers`} />
            <span aria-hidden="true" />
            <em>{offer.active ? "On" : "Off"}</em>
          </label>
          <button type="button" className="btn btn--outline btn--small" onClick={onToggleOpen} aria-expanded={open}>
            {open ? "Close" : "Edit"}
          </button>
          <button type="button" className="btn btn--outline btn--small btn--danger" onClick={onRemove}>
            Remove
          </button>
        </div>
      </header>

      {open ? (
        <div className="offer-form">
          <div className="step">
            <span className="step__n">1</span>
            <div className="step__body">
              <label>
                Offer name
                <input value={offer.title} onChange={(event) => onChange({ title: event.target.value })} placeholder={NEW_TITLE[offer.venue]} />
              </label>
              <label>
                What the customer gets
                <input value={offer.value} onChange={(event) => onChange({ value: event.target.value })} placeholder="For example: Grand opening prices on two house favourites" />
              </label>
              <label>
                Short description (optional)
                <textarea rows={2} value={offer.description} onChange={(event) => onChange({ description: event.target.value })} />
              </label>
            </div>
          </div>

          <div className="step">
            <span className="step__n">2</span>
            <div className="step__body">
              <p className="step__title">
                {offer.venue === "bar" ? "Drinks and items on offer" : offer.venue === "buffet" ? "Buffet prices on offer" : "Dishes on offer"}
                {offer.venue === "delivery" ? " (optional)" : ""}
              </p>
              <ItemPicker showAll={offer.venue === "buffet"} prices={prices} taken={offer.items.map((item) => item.name)} onPick={(name) => onChange({ items: [...offer.items, { name, originalPrice: prices.get(name) ?? 0, offerPrice: NaN }] })} />
              {offer.items.length ? (
                <ul className="picked">
                  {offer.items.map((item, index) => {
                    const valid = item.offerPrice > 0 && item.offerPrice < item.originalPrice;
                    const saving = valid ? item.originalPrice - item.offerPrice : 0;
                    return (
                      <li key={item.name}>
                        <span className="picked__name">{item.name}</span>
                        <span className="picked__was">Regular {formatPrice(item.originalPrice)}</span>
                        <label className="picked__price">
                          Offer £
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={Number.isFinite(item.offerPrice) ? item.offerPrice : ""}
                            aria-label={`Offer price for ${item.name}`}
                            onChange={(event) => onChange({ items: offer.items.map((entry, i) => (i === index ? { ...entry, offerPrice: money(event.target.value) } : entry)) })}
                          />
                        </label>
                        <span className={`picked__save${valid ? "" : " is-bad"}`}>
                          {Number.isFinite(item.offerPrice) ? (valid ? `Save ${formatPrice(saving)} (${Math.round((saving / item.originalPrice) * 100)}% off)` : "Must be below the regular price") : "Enter the offer price"}
                        </span>
                        <button type="button" className="icon-btn" aria-label={`Remove ${item.name}`} onClick={() => onChange({ items: offer.items.filter((_, i) => i !== index) })}>
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="step">
            <span className="step__n">3</span>
            <div className="step__body">
              <p className="step__title">Conditions</p>
              <div className="chips">
                {QUICK_CONDITIONS[offer.venue].map((condition) => {
                  const on = offer.conditions.includes(condition);
                  return (
                    <button
                      key={condition}
                      type="button"
                      className={`chipbtn${on ? " is-on" : ""}`}
                      aria-pressed={on}
                      onClick={() => onChange({ conditions: on ? offer.conditions.filter((c) => c !== condition) : [...offer.conditions, condition] })}
                    >
                      {on ? "✓ " : "+ "}
                      {condition}
                    </button>
                  );
                })}
              </div>
              <CustomConditions conditions={offer.conditions.filter((c) => !QUICK_CONDITIONS[offer.venue].includes(c))} onChange={(custom) => onChange({ conditions: [...offer.conditions.filter((c) => QUICK_CONDITIONS[offer.venue].includes(c)), ...custom] })} />
              <div className="dates">
                <label>
                  Starts (optional)
                  <input type="date" value={offer.starts ?? ""} onChange={(event) => onChange({ starts: event.target.value || undefined })} />
                </label>
                <label>
                  Ends (optional)
                  <input type="date" value={offer.expires ?? ""} onChange={(event) => onChange({ expires: event.target.value || undefined })} />
                </label>
              </div>
            </div>
          </div>

          <div className="step">
            <span className="step__n">4</span>
            <div className="step__body">
              <label>
                Confirmed by (staff only, never shown to customers)
                <input value={offer.source} onChange={(event) => onChange({ source: event.target.value })} placeholder="For example: Owner, 7 Nov 2026" />
              </label>
            </div>
          </div>

          {problems.length ? (
            <div className="todo" role="status">
              <p>{offer.active ? "Before customers can see this offer:" : "Still to do before switching it on:"}</p>
              <ul>
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="todo todo--ok">{offer.active ? "Ready. It shows to customers once you save and publish." : "Ready. Switch it On to show it to customers."}</p>
          )}
        </div>
      ) : null}
    </article>
  );
}

/** Type to search the venue's menu, then click a result to add it. */
function ItemPicker({ prices, taken, onPick, showAll = false }: { prices: Map<string, number>; taken: string[]; onPick: (name: string) => void; showAll?: boolean }) {
  const [query, setQuery] = useState("");
  const matches = [...prices.entries()].filter(([name]) => !taken.includes(name) && name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8);
  if (showAll && !matches.length && !query) return null;
  return (
    <div className={`picker${showAll ? " picker--inline" : ""}`}>
      {showAll ? null : (
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the menu, for example Kottu" aria-label="Search the menu to add an item" />
      )}
      {showAll || query.trim() ? (
        <ul className="picker__list">
          {matches.length ? (
            matches.map(([name, price]) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(name);
                    setQuery("");
                  }}
                >
                  <span>{name}</span>
                  <span>{formatPrice(price)}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="picker__none">Nothing on this menu matches "{query}".</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

function CustomConditions({ conditions, onChange }: { conditions: string[]; onChange: (list: string[]) => void }) {
  const [text, setText] = useState("");
  const add = () => {
    const value = text.trim();
    if (!value || conditions.includes(value)) return;
    onChange([...conditions, value]);
    setText("");
  };
  return (
    <div className="custom-conds">
      {conditions.length ? (
        <div className="chips">
          {conditions.map((condition) => (
            <span key={condition} className="chipbtn is-on">
              {condition}
              <button type="button" className="icon-btn" aria-label={`Remove condition ${condition}`} onClick={() => onChange(conditions.filter((c) => c !== condition))}>
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="custom-conds__add">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder="Add your own condition"
          aria-label="Add your own condition"
        />
        <button type="button" className="btn btn--outline btn--small" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

// ---------- Buffet Special Menu ----------

type BuffetGroupData = NonNullable<BuffetInfo["groups"]>[number];
interface RestaurantDish {
  name: string;
  section: string;
}

/** Dishes (not deals) from the restaurant menu, which the buffet picks from instead of copying. */
const restaurantDishes = (doc: MenuDoc): RestaurantDish[] =>
  doc.categories.flatMap((category) => (category.kind === "items" ? category.items.map((item) => ({ name: item.name, section: category.label })) : []));

function BuffetEditor({ buffet, onChange }: { buffet: BuffetInfo; onChange: (buffet: BuffetInfo) => void }) {
  const set = (patch: Partial<BuffetInfo>) => onChange({ ...buffet, ...patch });
  const [menu, setMenu] = useState<RestaurantDish[] | null>(null);
  const [menuError, setMenuError] = useState("");
  const [picking, setPicking] = useState<number | null>(null);
  const [newSection, setNewSection] = useState("");

  // The restaurant menu as admins see it (draft if there is one), so new dishes can be picked straight away.
  useEffect(() => {
    api("/api/staff/content?venue=restaurant")
      .then((data: Loaded) => setMenu(restaurantDishes(data.doc)))
      .catch((error: Error) => setMenuError(error.message));
  }, []);

  const groups = buffet.groups ?? [];
  const setGroups = (next: BuffetGroupData[]) => set({ groups: next });
  const onMenu = new Set(menu?.map((dish) => dish.name));
  const groupOf = new Map(groups.flatMap((group) => group.items.map((item) => [item, group.title] as const)));
  const missing = menu ? groups.flatMap((group) => group.items).filter((item) => !onMenu.has(item)) : [];
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  const updateGroup = (index: number, patch: Partial<BuffetGroupData>) => setGroups(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  const addSection = () => {
    const title = newSection.trim().replace(/\s+/g, " ");
    if (!title || groups.some((group) => group.title.toLowerCase() === title.toLowerCase())) return;
    setGroups([...groups, { title, items: [] }]);
    setNewSection("");
    setPicking(groups.length);
  };

  return (
    <section className="ed-section" aria-labelledby="buffet-h">
      <div className="ed-section__head">
        <h3 id="buffet-h">Buffet prices and times</h3>
      </div>
      <p className="editor__hint">Buffet prices belong to the buffet only. Changing them never changes a restaurant menu price. Shown on the website and the restaurant QR menu.</p>
      <div className="buffet-form">
        <label>
          Days
          <input value={buffet.days} onChange={(event) => set({ days: event.target.value })} maxLength={80} />
        </label>
        <label>
          Hours
          <input value={buffet.hours} onChange={(event) => set({ hours: event.target.value })} maxLength={80} />
        </label>
        <label>
          Adult price £
          <input type="number" inputMode="decimal" step="0.01" min="0" value={buffet.adultPrice} onChange={(event) => set({ adultPrice: money(event.target.value) })} />
        </label>
        <label>
          Kids price £
          <input type="number" inputMode="decimal" step="0.01" min="0" value={buffet.kidsPrice} onChange={(event) => set({ kidsPrice: money(event.target.value) })} />
        </label>
        <label>
          Kids note
          <input value={buffet.kidsNote} onChange={(event) => set({ kidsNote: event.target.value })} maxLength={80} />
        </label>
        <label>
          Booking phone
          <input value={buffet.bookingPhone} onChange={(event) => set({ bookingPhone: event.target.value })} maxLength={80} />
        </label>
      </div>

      <div className="ed-section__head bf-head">
        <h3>
          Dishes on the buffet <span className="bf-count">{total}</span>
        </h3>
      </div>
      <p className="editor__hint">Pick dishes from the restaurant menu. Nothing is copied or duplicated, and restaurant prices stay as they are.</p>
      {menuError ? <p className="editor__warn">The restaurant menu could not load ({menuError}). You can still remove dishes.</p> : null}
      {missing.length ? (
        <div className="todo" role="status">
          <p>Not on the restaurant menu any more (renamed or removed). Remove them, or add them to the restaurant menu first:</p>
          <ul>
            {missing.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="bf-groups">
        {groups.map((group, index) => (
          <div className="bf-group" key={index}>
            <div className="bf-group__head">
              <input className="bf-group__title" value={group.title} maxLength={40} onChange={(event) => updateGroup(index, { title: event.target.value })} aria-label="Section name" />
              <span className="bf-group__n">{group.items.length} dishes</span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove the ${group.title} section`}
                onClick={() => {
                  if (group.items.length && !window.confirm(`Remove the ${group.title} section and its ${group.items.length} dishes from the buffet?`)) return;
                  setGroups(groups.filter((_, i) => i !== index));
                  setPicking(null);
                }}
              >
                ×
              </button>
            </div>
            {group.items.length ? (
              <ul className="bf-dishes">
                {group.items.map((item) => {
                  const lost = Boolean(menu) && !onMenu.has(item);
                  return (
                    <li key={item} className={`bf-dish${lost ? " is-missing" : ""}`} title={lost ? "Not on the restaurant menu" : undefined}>
                      {item}
                      <button type="button" aria-label={`Remove ${item} from the buffet`} onClick={() => updateGroup(index, { items: group.items.filter((entry) => entry !== item) })}>
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="ed-empty">No dishes yet.</p>
            )}
            {picking === index ? (
              <DishPicker
                menu={menu}
                group={group}
                groupOf={groupOf}
                onToggle={(name) => updateGroup(index, { items: group.items.includes(name) ? group.items.filter((entry) => entry !== name) : [...group.items, name] })}
                onDone={() => setPicking(null)}
              />
            ) : (
              <button type="button" className="mi-add-btn" disabled={!menu} onClick={() => setPicking(index)}>
                + Add dishes to {group.title || "this section"}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="custom-conds__add bf-new">
        <input
          value={newSection}
          maxLength={40}
          onChange={(event) => setNewSection(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addSection())}
          placeholder="New buffet section, for example Grill"
          aria-label="New buffet section name"
        />
        <button type="button" className="btn btn--outline btn--small" onClick={addSection}>
          Add section
        </button>
      </div>
    </section>
  );
}

/** Tap restaurant dishes to add them to a buffet section (tap again to take them out). */
function DishPicker({
  menu,
  group,
  groupOf,
  onToggle,
  onDone,
}: {
  menu: RestaurantDish[] | null;
  group: BuffetGroupData;
  groupOf: Map<string, string>;
  onToggle: (name: string) => void;
  onDone: () => void;
}) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("All");
  if (!menu) return <p className="ed-empty">Loading the restaurant menu...</p>;
  const sections = ["All", ...new Set(menu.map((dish) => dish.section))];
  const q = query.trim().toLowerCase();
  const shown = menu.filter((dish) => (section === "All" || dish.section === section) && (!q || dish.name.toLowerCase().includes(q)));
  return (
    <div className="dish-picker">
      <div className="dish-picker__bar">
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the restaurant menu" aria-label="Search the restaurant menu" autoFocus />
        <button type="button" className="btn btn--gold btn--small" onClick={onDone}>
          Done
        </button>
      </div>
      <div className="chips dish-picker__sections" role="group" aria-label="Restaurant menu sections">
        {sections.map((name) => (
          <button key={name} type="button" className={`chipbtn${section === name ? " is-on" : ""}`} aria-pressed={section === name} onClick={() => setSection(name)}>
            {name}
          </button>
        ))}
      </div>
      <ul className="dish-picker__list">
        {shown.length ? (
          shown.map((dish) => {
            const here = group.items.includes(dish.name);
            const elsewhere = !here ? groupOf.get(dish.name) : undefined;
            return (
              <li key={dish.name}>
                <button type="button" className={`dish-opt${here ? " is-on" : ""}`} aria-pressed={here} disabled={Boolean(elsewhere)} onClick={() => onToggle(dish.name)}>
                  <span className="dish-opt__tick" aria-hidden="true">
                    {here ? "✓" : "+"}
                  </span>
                  <span className="dish-opt__name">{dish.name}</span>
                  <span className="dish-opt__sec">{elsewhere ? `In ${elsewhere}` : dish.section}</span>
                </button>
              </li>
            );
          })
        ) : (
          <li className="picker__none">No restaurant dish matches "{query}".</li>
        )}
      </ul>
    </div>
  );
}

// ---------- menu prices ----------

type Row = { name: string; price: number; note?: string; includes?: string[] };
type MenuChange = (categories: MenuDoc["categories"], renamed?: { from: string; to: string }, removed?: string) => void;

const rowsOf = (category: MenuDoc["categories"][number]): Row[] => (category.kind === "items" ? category.items : category.deals);
const withRows = (category: MenuDoc["categories"][number], rows: Row[]): MenuDoc["categories"][number] =>
  category.kind === "items"
    ? { ...category, items: rows.map(({ name, price, note }) => (note ? { name, price, note } : { name, price })) }
    : { ...category, deals: rows.map(({ name, price, includes }) => ({ name, price, includes: includes ?? [] })) };
const lines = (text: string) => text.split(/\n|,/).map((line) => line.trim()).filter(Boolean);

/** Menu items: change prices, add new dishes or drinks, rename or remove them. */
function MenuItemsEditor({ doc, onChange }: { doc: MenuDoc; onChange: MenuChange }) {
  const [query, setQuery] = useState("");
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const keepOpen = (id: string) => setOpenGroups((current) => new Set(current).add(id));
  const q = query.trim().toLowerCase();
  const allNames = useMemo(() => new Set(doc.categories.flatMap((category) => rowsOf(category).map((row) => row.name.toLowerCase()))), [doc]);
  const offerUsing = (name: string) => doc.offers.find((offer) => offer.items.some((item) => item.name === name));

  const replaceRows = (categoryIndex: number, rows: Row[], renamed?: { from: string; to: string }, removed?: string) =>
    onChange(doc.categories.map((category, index) => (index === categoryIndex ? withRows(category, rows) : category)), renamed, removed);

  return (
    <section className="ed-section" aria-labelledby="prices-h">
      <div className="ed-section__head">
        <h3 id="prices-h">{VENUE_TITLE[doc.venue]} items</h3>
        <input type="search" className="price-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a dish" aria-label="Find a dish" />
      </div>
      <p className="editor__hint">Change a price, add a new dish or drink to a section, or edit and remove one. New items show on the {VENUE_TITLE[doc.venue].toLowerCase()} once you save and publish.</p>
      {doc.categories.map((category, categoryIndex) => {
        const all = rowsOf(category);
        const rows = all.map((row, rowIndex) => ({ row, rowIndex })).filter(({ row }) => !q || row.name.toLowerCase().includes(q));
        if (q && !rows.length) return null;
        const isDeals = category.kind === "deals";
        return (
          <details
            className="price-group"
            key={category.id}
            open={Boolean(q) || openGroups.has(category.id)}
            onToggle={(event) => {
              if (q) return;
              const isOpen = event.currentTarget.open;
              setOpenGroups((current) => {
                const next = new Set(current);
                if (isOpen) next.add(category.id);
                else next.delete(category.id);
                return next;
              });
            }}
          >
            <summary>
              {category.label} <span>({all.length})</span>
            </summary>
            <ul className="mi-list">
              {rows.map(({ row, rowIndex }) => {
                const key = `${category.id}/${row.name}`;
                const update = (patch: Partial<Row>, renamed?: { from: string; to: string }) =>
                  replaceRows(categoryIndex, all.map((entry, i) => (i === rowIndex ? { ...entry, ...patch } : entry)), renamed);
                return (
                  <li key={key} className={`mi-row${justAdded === key ? " is-new" : ""}`}>
                    {editingRow === key ? (
                      <ItemForm
                        isDeals={isDeals}
                        initial={row}
                        taken={allNames}
                        submitLabel="Done"
                        onCancel={() => setEditingRow(null)}
                        onSubmit={(next) => {
                          update(next, next.name !== row.name ? { from: row.name, to: next.name } : undefined);
                          keepOpen(category.id);
                          setEditingRow(null);
                        }}
                      />
                    ) : (
                      <>
                        <div className="mi-row__text">
                          <span className="mi-row__name">{row.name}</span>
                          {row.note ? <span className="mi-row__note">{row.note}</span> : null}
                          {row.includes?.length ? <span className="mi-row__note">{row.includes.join(", ")}</span> : null}
                        </div>
                        <label className="mi-row__price">
                          £
                          <input type="number" inputMode="decimal" step="0.01" min="0" value={row.price} onChange={(event) => update({ price: money(event.target.value) })} aria-label={`Price for ${row.name}`} />
                        </label>
                        <div className="mi-row__btns">
                          <button type="button" className="mini-btn" onClick={() => setEditingRow(key)} aria-label={`Edit ${row.name}`}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label={`Remove ${row.name}`}
                            onClick={() => {
                              const offer = offerUsing(row.name);
                              const warning = offer ? `\n\nIt is also in the offer "${offer.title}" and will be taken out of it.` : "";
                              if (!window.confirm(`Remove ${row.name} from ${category.label}?${warning}`)) return;
                              replaceRows(categoryIndex, all.filter((_, i) => i !== rowIndex), undefined, row.name);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            {q ? null : adding === category.id ? (
              <div className="mi-add">
                <p className="mi-add__title">New {isDeals ? "deal" : "item"} in {category.label}</p>
                <ItemForm
                  isDeals={isDeals}
                  taken={allNames}
                  submitLabel={`Add to ${category.label}`}
                  onCancel={() => setAdding(null)}
                  onSubmit={(next) => {
                    replaceRows(categoryIndex, [...all, next]);
                    keepOpen(category.id);
                    setJustAdded(`${category.id}/${next.name}`);
                    setAdding(null);
                  }}
                />
              </div>
            ) : (
              <button type="button" className="mi-add-btn" onClick={() => (keepOpen(category.id), setAdding(category.id))}>
                + Add {isDeals ? "a deal" : "an item"} to {category.label}
              </button>
            )}
          </details>
        );
      })}
      <p className="editor__hint">Printed PDFs do not update by themselves. After publishing menu changes, ask for the PDFs to be regenerated.</p>
    </section>
  );
}

/** Name, price and note (or what a deal includes), with friendly checks before it is added. */
function ItemForm({
  isDeals,
  initial,
  taken,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  isDeals: boolean;
  initial?: Row;
  taken: Set<string>;
  submitLabel: string;
  onSubmit: (row: Row) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [extra, setExtra] = useState(isDeals ? (initial?.includes ?? []).join("\n") : (initial?.note ?? ""));
  const [tried, setTried] = useState(false);

  const cleanName = name.trim().replace(/\s+/g, " ");
  const value = money(price);
  const problems: string[] = [];
  if (!cleanName) problems.push("Enter a name.");
  else if (/[<>]/.test(cleanName)) problems.push("The name cannot contain < or >.");
  else if (cleanName.length > 60) problems.push("Keep the name under 60 characters.");
  else if (cleanName.toLowerCase() !== initial?.name.toLowerCase() && taken.has(cleanName.toLowerCase())) problems.push(`${cleanName} is already on this menu.`);
  if (!(value > 0 && value < 1000)) problems.push("Enter a price between £0.01 and £999.");
  if (/[<>]/.test(extra)) problems.push("The note cannot contain < or >.");
  if (isDeals && !lines(extra).length) problems.push("List what the deal includes.");

  const submit = () => {
    setTried(true);
    if (problems.length) return;
    onSubmit(isDeals ? { name: cleanName, price: value, includes: lines(extra) } : { name: cleanName, price: value, note: extra.trim() || undefined });
  };

  return (
    <div className="item-form" onKeyDown={(event) => event.key === "Enter" && event.target instanceof HTMLInputElement && (event.preventDefault(), submit())}>
      <div className="item-form__grid">
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder={isDeals ? "For example Family Deal" : "For example Chicken 65"} autoFocus maxLength={60} />
        </label>
        <label>
          Price £
          <input type="number" inputMode="decimal" step="0.01" min="0" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" />
        </label>
      </div>
      <label>
        {isDeals ? "What it includes (one per line)" : "Short note (optional)"}
        {isDeals ? (
          <textarea rows={3} value={extra} onChange={(event) => setExtra(event.target.value)} placeholder={"1 curry\n1 rice\n1 soft drink"} />
        ) : (
          <input value={extra} onChange={(event) => setExtra(event.target.value)} placeholder="For example Chicken, mutton or beef" maxLength={80} />
        )}
      </label>
      {tried && problems.length ? (
        <ul className="offer-problems" role="alert">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}
      <div className="item-form__btns">
        <button type="button" className="btn btn--gold btn--small" onClick={submit}>
          {submitLabel}
        </button>
        <button type="button" className="btn btn--outline btn--small" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
