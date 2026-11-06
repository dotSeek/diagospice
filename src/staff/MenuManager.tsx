import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { OFFER_LABEL, VENUE_TITLE, menuPrices } from "../data/content";
import type { BuffetInfo, MenuDoc, Offer, Venue } from "../data/content";
import { ALLERGENS, DIETARY, MENU_VENUES, newId, renderMenu } from "../data/catalogue";
import type { BuffetDoc, Catalogue, CatalogueCategory, CatalogueItem, ItemType, MenuConfig, MenuEntry, MenuVenue } from "../data/catalogue";
import { formatPrice } from "../data/menu";
import { AUDIENCE, DEFAULT_CONDITION, NEW_TITLE, OFFERS_HEADING, OfferCard, api, editable, money, previewUrl, when } from "./ContentEditor";

// Centralised menu manager (menu model v2). Items are created and edited once in Master items;
// each menu (delivery, restaurant, bar) only sets which items it shows, where, in what order and
// at what price, plus its own offers. The buffet picks dishes from the same master list and keeps
// its own adult and kids prices. Every change is a DRAFT until it is published.

type DocKey = "catalogue" | Venue;
type DocValue = Catalogue | MenuConfig | BuffetDoc;
interface Slot<T extends DocValue = DocValue> {
  doc: T;
  hasDraft: boolean;
  publishedUpdated: string;
  dirty: boolean;
}
type Slots = { catalogue: Slot<Catalogue>; buffet: Slot<BuffetDoc> } & Record<MenuVenue, Slot<MenuConfig>>;
type Tab = "items" | MenuVenue | "buffet";
type Msg = { kind: "ok" | "error"; text: string; problems?: string[] } | null;

const DOC_KEYS: DocKey[] = ["catalogue", "delivery", "restaurant", "bar", "buffet"];
const DOC_NAME: Record<DocKey, string> = { catalogue: "Master items", delivery: "Delivery", restaurant: "Restaurant", bar: "Bar", buffet: "Buffet" };
const TYPE_NAME: Record<ItemType, string> = { food: "Food", drink: "Drink", deal: "Deal" };
const PRICE_ORDER: MenuVenue[] = ["restaurant", "delivery", "bar"];

const entryOf = (config: MenuConfig, itemId: string) => config.entries.find((entry) => entry.itemId === itemId);
const groupsWith = (buffet: BuffetDoc, itemId: string) => buffet.buffet.groups.findIndex((group) => group.itemIds.includes(itemId));
const namesFor = (catalogue: Catalogue, ids: string[]) => ids.map((id) => catalogue.items.find((item) => item.id === id)?.name ?? id);
/** A price for an item taken from another menu, used when adding it somewhere new. */
const suggestedPrice = (slots: Slots, itemId: string, except?: MenuVenue) => {
  for (const venue of PRICE_ORDER) {
    if (venue === except) continue;
    const entry = entryOf(slots[venue].doc, itemId);
    if (entry && entry.price > 0) return entry.price;
  }
  return 0;
};

/** This menu's section for a catalogue category, created with the category name if missing. */
const sectionFor = (config: MenuConfig, category: CatalogueCategory): { config: MenuConfig; sectionId: string } => {
  const existing = config.sections.find((section) => section.categoryId === category.id);
  if (existing) return { config, sectionId: existing.id };
  const base = `${config.venue === "bar" ? "bar-" : ""}${category.id.replace(/^cat-/, "")}`;
  const taken = new Set(config.sections.map((section) => section.id));
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return { config: { ...config, sections: [...config.sections, { id, categoryId: category.id, label: category.name }] }, sectionId: id };
};

export function MenuManager() {
  const [slots, setSlots] = useState<Slots | null>(null);
  const [storage, setStorage] = useState<"redis" | "file" | "read-only">("file");
  const [tab, setTab] = useState<Tab>("items");
  const [message, setMessage] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const loaded = await Promise.all(DOC_KEYS.map((key) => api(`/api/staff/content?venue=${key}`)));
    const next = {} as Record<DocKey, Slot>;
    DOC_KEYS.forEach((key, index) => {
      const data = loaded[index] as { storage: typeof storage; hasDraft: boolean; publishedUpdated: string; doc: DocValue };
      setStorage(data.storage);
      const doc = key === "catalogue" ? data.doc : editable(data.doc as MenuConfig | BuffetDoc);
      next[key] = { doc, hasDraft: data.hasDraft, publishedUpdated: data.publishedUpdated, dirty: false };
    });
    setSlots(next as unknown as Slots);
  }, []);

  useEffect(() => {
    load().catch((error: Error) => setMessage({ kind: "error", text: error.message }));
  }, [load]);

  // The entrance poster panel asks to open a menu's offers ("Manage restaurant offers").
  useEffect(() => {
    const open = (event: Event) => {
      const target = (event as CustomEvent<Venue>).detail;
      if ([...MENU_VENUES, "buffet"].includes(target)) setTab(target as Tab);
    };
    window.addEventListener("diago:edit-offers", open);
    return () => window.removeEventListener("diago:edit-offers", open);
  }, []);

  if (!slots) return <p className="card__lead">{message?.text ?? "Loading menus..."}</p>;

  const dirtyKeys = DOC_KEYS.filter((key) => slots[key].dirty);
  const update = (changes: Partial<{ [K in DocKey]: DocValue }>) => {
    setSlots((current) => {
      const next = { ...current! } as Record<DocKey, Slot>;
      for (const [key, doc] of Object.entries(changes) as [DocKey, DocValue][]) next[key] = { ...next[key], doc, dirty: true };
      return next as unknown as Slots;
    });
    setMessage(null);
  };

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await load();
      setMessage({ kind: "ok", text: label });
    } catch (error) {
      const err = error as Error & { problems?: string[] };
      setMessage({ kind: "error", text: err.message, problems: err.problems });
      await load().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  // Master items first, so menus and the buffet are checked against the new items.
  const save = () =>
    run("Draft saved. Preview it, then publish when you are happy.", async () => {
      for (const key of dirtyKeys) {
        try {
          await api(`/api/staff/content?venue=${key}`, { method: "PUT", body: JSON.stringify(slots[key].doc) });
        } catch (error) {
          throw Object.assign(new Error(`${DOC_NAME[key]}: ${(error as Error).message}`), { problems: (error as { problems?: string[] }).problems });
        }
      }
    });

  const publishKeys = tab === "items" ? DOC_KEYS.filter((key) => slots[key].hasDraft) : (["catalogue", tab] as DocKey[]).filter((key) => slots[key].hasDraft);
  const publish = () => {
    const names = publishKeys.map((key) => DOC_NAME[key]).join(", ");
    if (!window.confirm(`Publish ${names} now? Customers see it within a minute.`)) return;
    void run(`Published: ${names}. The website and QR menus now show this version.`, async () => {
      for (const key of publishKeys) {
        try {
          await api(`/api/staff/publish?venue=${key}`, { method: "POST" });
        } catch (error) {
          throw Object.assign(new Error(`${DOC_NAME[key]}: ${(error as Error).message}`), { problems: (error as { problems?: string[] }).problems });
        }
        if (key !== "catalogue") window.dispatchEvent(new CustomEvent("diago:published", { detail: key }));
      }
    });
  };
  const discardKeys = tab === "items" ? DOC_KEYS.filter((key) => slots[key].hasDraft) : ([tab] as DocKey[]).filter((key) => slots[key].hasDraft);
  const discard = () => {
    if (!window.confirm(`Throw away the drafts of ${discardKeys.map((key) => DOC_NAME[key]).join(", ")}?`)) return;
    void run("Draft discarded.", async () => {
      for (const key of discardKeys) await api(`/api/staff/discard?venue=${key}`, { method: "POST" });
    });
  };
  const switchTab = (next: Tab) => setTab(next);

  const readOnly = storage === "read-only";
  const tabs: [Tab, string][] = [["items", "Master items"], ["delivery", "Delivery"], ["restaurant", "Restaurant"], ["bar", "Bar"], ["buffet", "Buffet"]];

  return (
    <div className="editor mm">
      <div className="editor__tabs" role="tablist" aria-label="Menus">
        {tabs.map(([key, label]) => {
          const docs: DocKey[] = key === "items" ? ["catalogue"] : [key];
          const pending = docs.some((doc) => slots[doc].dirty || slots[doc].hasDraft);
          return (
            <button key={key} type="button" role="tab" aria-selected={key === tab} className={`tabbtn${key === tab ? " is-on" : ""}`} onClick={() => switchTab(key)}>
              {label}
              {pending ? <span className="mm-dot" title="Not published yet" aria-label="not published yet" /> : null}
            </button>
          );
        })}
      </div>

      {readOnly ? <p className="editor__warn">Saving is switched off until Upstash Redis is connected to the Vercel project. You can look around, but changes cannot be saved yet.</p> : null}

      {tab === "items" ? <MasterItems slots={slots} update={update} /> : null}
      {tab === "delivery" || tab === "restaurant" || tab === "bar" ? <MenuTab venue={tab} slots={slots} update={update} /> : null}
      {tab === "buffet" ? <BuffetBuilder slots={slots} update={update} /> : null}

      <div className={`ed-bar ed-bar--${dirtyKeys.length ? "unsaved" : publishKeys.length ? "draft" : "live"}`} role="region" aria-label="Save and publish">
        <div className="mm-status">
          {DOC_KEYS.map((key) => {
            const slot = slots[key];
            const state = slot.dirty ? "unsaved" : slot.hasDraft ? "draft" : "live";
            return (
              <span key={key} className={`pill pill--${state === "live" ? "live" : state === "draft" ? "warn" : "off"}`} title={state === "live" ? `Published ${when(slot.publishedUpdated)}` : undefined}>
                {DOC_NAME[key]}: {state === "unsaved" ? "unsaved" : state === "draft" ? "draft" : "published"}
              </span>
            );
          })}
        </div>
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
          <button type="button" className="btn btn--gold" disabled={busy || !dirtyKeys.length || readOnly} onClick={save}>
            Save draft
          </button>
          {tab !== "items" ? (
            <a className={`btn btn--outline${dirtyKeys.length ? " is-disabled" : ""}`} href={previewUrl[tab]} target="_blank" rel="noopener" aria-disabled={Boolean(dirtyKeys.length)}>
              Preview draft
            </a>
          ) : null}
          <button type="button" className="btn btn--red" disabled={busy || Boolean(dirtyKeys.length) || !publishKeys.length} onClick={publish}>
            {tab === "items" ? "Publish all" : "Publish"}
          </button>
          <button type="button" className="btn btn--outline" disabled={busy || !discardKeys.length} onClick={discard}>
            Discard draft
          </button>
        </div>
      </div>
    </div>
  );
}

type Update = (changes: Partial<{ [K in DocKey]: DocValue }>) => void;

// ---------- Master items ----------

function MasterItems({ slots, update }: { slots: Slots; update: Update }) {
  const catalogue = slots.catalogue.doc;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState<"all" | ItemType>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<CatalogueItem | "new" | null>(null);
  const [bulkTarget, setBulkTarget] = useState<MenuVenue | "buffet">("restaurant");
  const [bulkGroup, setBulkGroup] = useState(0);
  const [notice, setNotice] = useState("");

  const q = query.trim().toLowerCase();
  const shown = catalogue.items.filter(
    (item) =>
      (showArchived || item.status === "active") &&
      (category === "all" || item.categoryId === category) &&
      (type === "all" || item.type === type) &&
      (!q || item.name.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q)),
  );
  const categoryName = (id: string) => catalogue.categories.find((entry) => entry.id === id)?.name ?? "No category";
  const toggle = (id: string) => setSelected((current) => (current.has(id) ? new Set([...current].filter((entry) => entry !== id)) : new Set(current).add(id)));
  const allShownSelected = shown.length > 0 && shown.every((item) => selected.has(item.id));

  /** Bulk: put the selected items on a menu (prices taken from another menu) or take them off. */
  const bulk = (on: boolean) => {
    const ids = [...selected];
    if (bulkTarget === "buffet") {
      const doc = structuredClone(slots.buffet.doc);
      if (!doc.buffet.groups.length) return setNotice("Add a buffet section first, in the Buffet tab.");
      let changed = 0;
      for (const id of ids) {
        const item = catalogue.items.find((entry) => entry.id === id)!;
        const at = groupsWith(doc, id);
        if (on && at < 0 && item.type !== "deal") {
          doc.buffet.groups[bulkGroup].itemIds.push(id);
          changed++;
        }
        if (!on && at >= 0) {
          doc.buffet.groups[at].itemIds = doc.buffet.groups[at].itemIds.filter((entry) => entry !== id);
          changed++;
        }
      }
      for (const group of doc.buffet.groups) group.items = namesFor(catalogue, group.itemIds);
      update({ buffet: doc });
      return setNotice(`${changed} item${changed === 1 ? "" : "s"} ${on ? "added to" : "taken off"} the buffet.${on ? " Deals are never added to the buffet." : ""}`);
    }
    let config = structuredClone(slots[bulkTarget].doc);
    const needPrice: string[] = [];
    let changed = 0;
    for (const id of ids) {
      const item = catalogue.items.find((entry) => entry.id === id)!;
      const entry = entryOf(config, id);
      if (!on) {
        if (entry?.visible) {
          entry.visible = false;
          changed++;
        }
        continue;
      }
      if (entry) {
        if (entry.price > 0) {
          entry.visible = true;
          changed++;
        } else needPrice.push(item.name);
        continue;
      }
      const price = suggestedPrice(slots, id, bulkTarget);
      const placed = sectionFor(config, catalogue.categories.find((entry) => entry.id === item.categoryId)!);
      config = placed.config;
      config.entries.push({ itemId: id, sectionId: placed.sectionId, price, visible: price > 0, offerEligible: true });
      if (price > 0) changed++;
      else needPrice.push(item.name);
    }
    update({ [bulkTarget]: config });
    setNotice(
      `${changed} item${changed === 1 ? "" : "s"} ${on ? "shown on" : "hidden on"} the ${VENUE_TITLE[bulkTarget].toLowerCase()}.` +
        (on ? " New items take their price from another menu, please check it." : "") +
        (needPrice.length ? ` Needs a price before it can show: ${needPrice.join(", ")}.` : ""),
    );
  };

  return (
    <section className="ed-section" aria-labelledby="mm-items-h">
      <div className="ed-section__head">
        <h3 id="mm-items-h">Master items</h3>
        <button type="button" className="btn btn--gold btn--small" onClick={() => setEditing("new")}>
          + Add new item
        </button>
      </div>
      <p className="editor__hint">Every dish, drink and deal, once. Change a name or description here and it changes on every menu. Prices and what shows are set per menu.</p>

      <div className="mm-toolbar">
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items" aria-label="Search items" />
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {catalogue.categories.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
        <div className="chips" role="group" aria-label="Filter by type">
          {(["all", "food", "drink", "deal"] as const).map((entry) => (
            <button key={entry} type="button" className={`chipbtn${type === entry ? " is-on" : ""}`} aria-pressed={type === entry} onClick={() => setType(entry)}>
              {entry === "all" ? "All" : TYPE_NAME[entry]}
            </button>
          ))}
        </div>
        <label className="mm-check">
          <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Show archived
        </label>
      </div>

      {selected.size ? (
        <div className="mm-bulk" role="region" aria-label="Bulk changes">
          <b>{selected.size} selected</b>
          <select value={bulkTarget} onChange={(event) => setBulkTarget(event.target.value as MenuVenue | "buffet")} aria-label="Menu for the bulk change">
            {MENU_VENUES.map((venue) => (
              <option key={venue} value={venue}>
                {VENUE_TITLE[venue]}
              </option>
            ))}
            <option value="buffet">Buffet</option>
          </select>
          {bulkTarget === "buffet" ? (
            <select value={bulkGroup} onChange={(event) => setBulkGroup(Number(event.target.value))} aria-label="Buffet section">
              {slots.buffet.doc.buffet.groups.map((group, index) => (
                <option key={index} value={index}>
                  {group.title}
                </option>
              ))}
            </select>
          ) : null}
          <button type="button" className="btn btn--gold btn--small" onClick={() => bulk(true)}>
            {bulkTarget === "buffet" ? "Add to buffet" : "Show on menu"}
          </button>
          <button type="button" className="btn btn--outline btn--small" onClick={() => bulk(false)}>
            {bulkTarget === "buffet" ? "Take off buffet" : "Hide on menu"}
          </button>
          <button type="button" className="mini-link" onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      ) : null}
      {notice ? (
        <p className="todo todo--ok" role="status">
          {notice}
        </p>
      ) : null}

      <div className="mm-table" role="table" aria-label="Master items">
        <div className="mm-row mm-row--head" role="row">
          <span role="columnheader">
            <input
              type="checkbox"
              checked={allShownSelected}
              aria-label="Select all shown items"
              onChange={() => setSelected(allShownSelected ? new Set() : new Set([...selected, ...shown.map((item) => item.id)]))}
            />
          </span>
          <span role="columnheader">Item</span>
          {MENU_VENUES.map((venue) => (
            <span role="columnheader" key={venue} className="mm-col">
              {DOC_NAME[venue]}
            </span>
          ))}
          <span role="columnheader" className="mm-col">
            Buffet
          </span>
          <span role="columnheader" />
        </div>
        {shown.map((item) => (
          <div className={`mm-row${item.status === "archived" ? " is-archived" : ""}${selected.has(item.id) ? " is-selected" : ""}`} role="row" key={item.id}>
            <span role="cell">
              <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} aria-label={`Select ${item.name}`} />
            </span>
            <span role="cell" className="mm-name">
              <b>{item.name}</b>
              <small>
                {categoryName(item.categoryId)} · {TYPE_NAME[item.type]}
                {item.status === "archived" ? " · Archived" : ""}
              </small>
              {item.description || item.includes?.length ? <small className="mm-desc">{item.description ?? item.includes!.join(", ")}</small> : null}
            </span>
            {MENU_VENUES.map((venue) => {
              const entry = entryOf(slots[venue].doc, item.id);
              return (
                <span role="cell" key={venue} className={`mm-col mm-price${entry ? (entry.visible ? " is-on" : " is-hidden") : ""}`} data-label={DOC_NAME[venue]}>
                  {entry ? (entry.visible ? formatPrice(entry.price) : `Hidden${entry.price > 0 ? ` ${formatPrice(entry.price)}` : ""}`) : "Not on menu"}
                </span>
              );
            })}
            <span role="cell" className={`mm-col mm-price${groupsWith(slots.buffet.doc, item.id) >= 0 ? " is-on" : ""}`} data-label="Buffet">
              {groupsWith(slots.buffet.doc, item.id) >= 0 ? "Included" : "Not included"}
            </span>
            <span role="cell">
              <button type="button" className="mini-btn" onClick={() => setEditing(item)} aria-label={`Edit ${item.name}`}>
                Edit
              </button>
            </span>
          </div>
        ))}
        {!shown.length ? <p className="ed-empty">No items match these filters.</p> : null}
      </div>

      <CategoryManager slots={slots} update={update} />

      {editing ? <ItemDrawer item={editing === "new" ? null : editing} slots={slots} update={update} onClose={() => setEditing(null)} /> : null}
    </section>
  );
}

/** Master categories: rename (menus that use the master name follow), add, remove when unused. */
function CategoryManager({ slots, update }: { slots: Slots; update: Update }) {
  const catalogue = slots.catalogue.doc;
  const [name, setName] = useState("");
  const [type, setType] = useState<ItemType>("food");
  const used = (id: string) => catalogue.items.some((item) => item.categoryId === id) || MENU_VENUES.some((venue) => slots[venue].doc.sections.some((section) => section.categoryId === id));
  const add = () => {
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean || catalogue.categories.some((entry) => entry.name.toLowerCase() === clean.toLowerCase())) return;
    update({ catalogue: { ...catalogue, categories: [...catalogue.categories, { id: newId("cat", clean, catalogue.categories.map((entry) => entry.id)), name: clean, type }] } });
    setName("");
  };
  const rename = (category: CatalogueCategory, next: string) => {
    const changes: Partial<{ [K in DocKey]: DocValue }> = { catalogue: { ...catalogue, categories: catalogue.categories.map((entry) => (entry.id === category.id ? { ...entry, name: next } : entry)) } };
    // Menus showing the master name follow it. Menus with their own name (bar) keep theirs.
    for (const venue of MENU_VENUES) {
      const config = slots[venue].doc;
      if (config.sections.some((section) => section.categoryId === category.id && section.label === category.name))
        changes[venue] = { ...config, sections: config.sections.map((section) => (section.categoryId === category.id && section.label === category.name ? { ...section, label: next } : section)) };
    }
    update(changes);
  };
  return (
    <details className="price-group mm-cats">
      <summary>
        Categories <span>({catalogue.categories.length})</span>
      </summary>
      <p className="editor__hint">The master name. Each menu can show its own name for a category in its tab (for example the bar's "Mains with rice or nan").</p>
      <ul className="mi-list">
        {catalogue.categories.map((category) => (
          <li key={category.id} className="mi-row mm-cat">
            <input value={category.name} maxLength={40} onChange={(event) => rename(category, event.target.value)} aria-label={`Name of ${category.name}`} />
            <span className="mm-tag">{TYPE_NAME[category.type]}</span>
            <button
              type="button"
              className="icon-btn"
              disabled={used(category.id)}
              title={used(category.id) ? "Still used by items or menus" : "Remove"}
              aria-label={`Remove ${category.name}`}
              onClick={() => update({ catalogue: { ...catalogue, categories: catalogue.categories.filter((entry) => entry.id !== category.id) } })}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="custom-conds__add">
        <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="New category, for example Hot drinks" aria-label="New category name" onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), add())} />
        <select value={type} onChange={(event) => setType(event.target.value as ItemType)} aria-label="New category type">
          <option value="food">Food</option>
          <option value="drink">Drink</option>
          <option value="deal">Deal</option>
        </select>
        <button type="button" className="btn btn--outline btn--small" onClick={add}>
          Add category
        </button>
      </div>
    </details>
  );
}

// ---------- Add or edit item drawer ----------

interface Placement {
  on: boolean;
  exists: boolean;
  price: string;
  sectionId: string;
}

function ItemDrawer({ item, slots, update, onClose }: { item: CatalogueItem | null; slots: Slots; update: Update; onClose: () => void }) {
  const catalogue = slots.catalogue.doc;
  const firstCategory = catalogue.categories.find((entry) => entry.type !== "deal") ?? catalogue.categories[0];
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [includes, setIncludes] = useState((item?.includes ?? []).join("\n"));
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? firstCategory?.id ?? "");
  const [type, setType] = useState<ItemType>(item?.type ?? firstCategory?.type ?? "food");
  const [image, setImage] = useState(item?.image ?? "");
  const [dietary, setDietary] = useState<string[]>(item?.dietary ?? []);
  const [allergens, setAllergens] = useState<string[]>(item?.allergens ?? []);
  const [archived, setArchived] = useState(item?.status === "archived");
  const [tried, setTried] = useState(false);
  const category = catalogue.categories.find((entry) => entry.id === categoryId);
  const isDeal = category?.type === "deal";

  const [places, setPlaces] = useState<Record<MenuVenue, Placement>>(() =>
    Object.fromEntries(
      MENU_VENUES.map((venue) => {
        const config = slots[venue].doc;
        const entry = item ? entryOf(config, item.id) : undefined;
        const home = config.sections.find((section) => section.categoryId === (item?.categoryId ?? categoryId));
        return [venue, { on: Boolean(entry?.visible), exists: Boolean(entry), price: entry ? String(entry.price || "") : "", sectionId: entry?.sectionId ?? home?.id ?? "" }];
      }),
    ) as Record<MenuVenue, Placement>,
  );
  const [buffetGroup, setBuffetGroup] = useState(item ? groupsWith(slots.buffet.doc, item.id) : -1);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  const cleanName = name.trim().replace(/\s+/g, " ");
  const lines = includes.split(/\n|,/).map((line) => line.trim()).filter(Boolean);
  const problems: string[] = [];
  if (!cleanName) problems.push("Enter a name.");
  else if (/[<>]/.test(cleanName) || cleanName.length > 60) problems.push("Keep the name under 60 characters, without < or >.");
  else if (catalogue.items.some((entry) => entry.id !== item?.id && entry.status === "active" && entry.name.toLowerCase() === cleanName.toLowerCase()))
    problems.push(`${cleanName} is already in the master items.`);
  if (!category) problems.push("Choose a category.");
  if (!isDeal && (description.length > 120 || /[<>]/.test(description))) problems.push("Keep the description under 120 characters, without < or >.");
  if (isDeal && !lines.length) problems.push("List what the deal includes.");
  if (image && !/^(https:\/\/|\/)\S*$/.test(image.trim())) problems.push("The image must be a web address starting with https:// or /.");
  for (const venue of MENU_VENUES) {
    const place = places[venue];
    if (place.on && !(money(place.price) > 0 && money(place.price) < 1000)) problems.push(`${VENUE_TITLE[venue]}: enter a price between £0.01 and £999.`);
  }

  const setPlace = (venue: MenuVenue, patch: Partial<Placement>) => setPlaces((current) => ({ ...current, [venue]: { ...current[venue], ...patch } }));

  const submit = () => {
    setTried(true);
    if (problems.length || !category) return;
    const id = item?.id ?? newId("item", cleanName, catalogue.items.map((entry) => entry.id));
    const saved: CatalogueItem = {
      id,
      name: cleanName,
      type: isDeal ? "deal" : type === "deal" ? "food" : type,
      categoryId,
      status: archived ? "archived" : "active",
      ...(isDeal ? { includes: lines } : description.trim() ? { description: description.trim() } : {}),
      ...(image.trim() ? { image: image.trim() } : {}),
      ...(dietary.length ? { dietary } : {}),
      ...(allergens.length ? { allergens } : {}),
    };
    const changes: Partial<{ [K in DocKey]: DocValue }> = {
      catalogue: { ...catalogue, items: item ? catalogue.items.map((entry) => (entry.id === id ? saved : entry)) : [...catalogue.items, saved] },
    };
    for (const venue of MENU_VENUES) {
      const place = places[venue];
      let config = slots[venue].doc;
      const entry = entryOf(config, id);
      if (!place.on && !entry) continue;
      if (!place.on && entry) {
        if (entry.visible) changes[venue] = { ...config, entries: config.entries.map((row) => (row.itemId === id ? { ...row, visible: false } : row)) };
        continue;
      }
      let sectionId = place.sectionId;
      if (!config.sections.some((section) => section.id === sectionId)) {
        const placed = sectionFor(config, category);
        config = placed.config;
        sectionId = placed.sectionId;
      }
      const row: MenuEntry = { itemId: id, sectionId, price: money(place.price), visible: true, offerEligible: entry?.offerEligible ?? true };
      if (entry && JSON.stringify(entry) === JSON.stringify(row)) continue;
      changes[venue] = { ...config, entries: entry ? config.entries.map((existing) => (existing.itemId === id ? row : existing)) : [...config.entries, row] };
    }
    const buffet = structuredClone(slots.buffet.doc);
    const at = groupsWith(buffet, id);
    if (at !== buffetGroup && !isDeal) {
      if (at >= 0) buffet.buffet.groups[at].itemIds = buffet.buffet.groups[at].itemIds.filter((entry) => entry !== id);
      if (buffetGroup >= 0) buffet.buffet.groups[buffetGroup].itemIds.push(id);
    }
    const nextCatalogue = changes.catalogue as Catalogue;
    for (const group of buffet.buffet.groups) group.items = namesFor(nextCatalogue, group.itemIds);
    if (JSON.stringify(buffet) !== JSON.stringify(slots.buffet.doc)) changes.buffet = buffet;
    update(changes);
    onClose();
  };

  const remove = () => {
    if (!item) return;
    const onMenus = MENU_VENUES.filter((venue) => entryOf(slots[venue].doc, item.id));
    if (!window.confirm(`Delete ${item.name} from the master items${onMenus.length ? ` and from the ${onMenus.map((venue) => DOC_NAME[venue]).join(", ")} menus` : ""}? Its offers lose it too. To keep it for later, archive it instead.`)) return;
    const changes: Partial<{ [K in DocKey]: DocValue }> = { catalogue: { ...catalogue, items: catalogue.items.filter((entry) => entry.id !== item.id) } };
    for (const venue of MENU_VENUES) {
      const config = slots[venue].doc;
      changes[venue] = {
        ...config,
        entries: config.entries.filter((entry) => entry.itemId !== item.id),
        offers: config.offers.map((offer) => ({ ...offer, items: offer.items.filter((entry) => entry.itemId !== item.id && entry.name !== item.name) })),
      };
    }
    const buffet = structuredClone(slots.buffet.doc);
    for (const group of buffet.buffet.groups) {
      group.itemIds = group.itemIds.filter((entry) => entry !== item.id);
      group.items = namesFor(catalogue, group.itemIds);
    }
    changes.buffet = buffet;
    update(changes);
    onClose();
  };

  const chipList = (options: readonly string[], value: string[], set: (next: string[]) => void, label: string) => (
    <div className="chips" role="group" aria-label={label}>
      {options.map((option) => {
        const on = value.includes(option);
        return (
          <button key={option} type="button" className={`chipbtn${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => set(on ? value.filter((entry) => entry !== option) : [...value, option])}>
            {on ? "✓ " : "+ "}
            {option}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="mm-drawer" role="dialog" aria-modal="true" aria-labelledby="mm-drawer-h">
      <button type="button" className="mm-drawer__scrim" aria-label="Close" onClick={onClose} />
      <div className="mm-drawer__panel">
        <header className="mm-drawer__head">
          <h3 id="mm-drawer-h">{item ? `Edit ${item.name}` : "New item"}</h3>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="mm-drawer__body" onKeyDown={(event) => event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.type !== "checkbox" && (event.preventDefault(), submit())}>
          <Group title="Details">
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} autoFocus placeholder="For example Chicken 65" />
            </label>
            <div className="mm-two">
              <label>
                Category
                <select
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value);
                    const next = catalogue.categories.find((entry) => entry.id === event.target.value);
                    if (next) setType(next.type);
                  }}
                >
                  {catalogue.categories.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Type
                <select value={isDeal ? "deal" : type} disabled={isDeal} onChange={(event) => setType(event.target.value as ItemType)}>
                  {isDeal ? <option value="deal">Deal</option> : null}
                  <option value="food">Food</option>
                  <option value="drink">Drink</option>
                </select>
              </label>
            </div>
            {isDeal ? (
              <label>
                What the deal includes (one per line)
                <textarea rows={3} value={includes} onChange={(event) => setIncludes(event.target.value)} placeholder={"1 curry\n1 rice\n1 soft drink"} />
              </label>
            ) : (
              <label>
                Description (optional)
                <input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={120} placeholder="For example 4 pieces" />
              </label>
            )}
          </Group>

          <Group title="Menus and prices" hint="Each menu has its own price. Switching a menu off hides the item there and keeps its price.">
            {MENU_VENUES.map((venue) => {
              const place = places[venue];
              const sections = slots[venue].doc.sections.filter((section) => slots.catalogue.doc.categories.find((entry) => entry.id === section.categoryId)?.type === "deal" === isDeal);
              return (
                <div key={venue} className={`mm-place${place.on ? " is-on" : ""}`}>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={place.on}
                      onChange={(event) => setPlace(venue, { on: event.target.checked, price: place.price || (event.target.checked && !place.exists && item ? String(suggestedPrice(slots, item.id, venue) || "") : place.price) })}
                      aria-label={`Show on the ${VENUE_TITLE[venue].toLowerCase()}`}
                    />
                    <span aria-hidden="true" />
                    <em>{VENUE_TITLE[venue]}</em>
                  </label>
                  {place.on ? (
                    <>
                      <label className="mm-price-in">
                        £
                        <input type="number" inputMode="decimal" step="0.01" min="0" value={place.price} onChange={(event) => setPlace(venue, { price: event.target.value })} aria-label={`${VENUE_TITLE[venue]} price`} />
                      </label>
                      <select value={place.sectionId} onChange={(event) => setPlace(venue, { sectionId: event.target.value })} aria-label={`${VENUE_TITLE[venue]} section`}>
                        {!sections.some((section) => section.id === place.sectionId) ? <option value="">{category?.name ?? "Section"} (new)</option> : null}
                        {sections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.label}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <span className="mm-place__off">{place.exists ? `Hidden${money(place.price) > 0 ? `, price kept ${formatPrice(money(place.price))}` : ""}` : "Not on this menu"}</span>
                  )}
                </div>
              );
            })}
            {!isDeal ? (
              <div className={`mm-place${buffetGroup >= 0 ? " is-on" : ""}`}>
                <label className="switch">
                  <input type="checkbox" checked={buffetGroup >= 0} onChange={(event) => setBuffetGroup(event.target.checked ? Math.max(0, slots.buffet.doc.buffet.groups.length ? 0 : -1) : -1)} aria-label="Include in the buffet" />
                  <span aria-hidden="true" />
                  <em>Buffet</em>
                </label>
                {buffetGroup >= 0 ? (
                  <select value={buffetGroup} onChange={(event) => setBuffetGroup(Number(event.target.value))} aria-label="Buffet section">
                    {slots.buffet.doc.buffet.groups.map((group, index) => (
                      <option key={index} value={index}>
                        {group.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="mm-place__off">Not included. The buffet has no item prices.</span>
                )}
              </div>
            ) : null}
          </Group>

          <Group title="Image (optional)">
            <label>
              Image address
              <input value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://... or /images/..." />
            </label>
            {image && /^(https:\/\/|\/)\S*$/.test(image) ? <img className="mm-thumb" src={image} alt="" /> : null}
          </Group>

          <Group title="Dietary and allergens (optional)" hint="Only tick what the owner has confirmed. Leave empty when unsure.">
            {chipList(DIETARY, dietary, setDietary, "Dietary")}
            <p className="step__title">Contains</p>
            {chipList(ALLERGENS, allergens, setAllergens, "Allergens")}
          </Group>

          <Group title="Status">
            <label className="switch">
              <input type="checkbox" checked={!archived} onChange={(event) => setArchived(!event.target.checked)} aria-label="Active" />
              <span aria-hidden="true" />
              <em>{archived ? "Archived: hidden on every menu and the buffet, nothing is lost" : "Active"}</em>
            </label>
          </Group>

          {tried && problems.length ? (
            <ul className="offer-problems" role="alert">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <footer className="mm-drawer__foot">
          <button type="button" className="btn btn--gold" onClick={submit}>
            {item ? "Save item" : "Add item"}
          </button>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          {item ? (
            <button type="button" className="btn btn--outline btn--danger mm-drawer__del" onClick={remove}>
              Delete
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="mm-group">
      <legend>{title}</legend>
      {hint ? <p className="editor__hint">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

// ---------- Offers (shared by the menu tabs and the buffet) ----------

function OffersSection({ venue, doc, offers, onChange }: { venue: Venue; doc: MenuDoc; offers: Offer[]; onChange: (offers: Offer[]) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const prices = useMemo(() => menuPrices(doc), [doc]);
  const add = () => {
    const id = `offer-${Date.now()}`;
    onChange([...offers, { id, title: NEW_TITLE[venue], venue, audience: AUDIENCE[venue], description: "", value: "", items: [], conditions: [DEFAULT_CONDITION[venue]], active: false, source: "" }]);
    setEditing(id);
  };
  return (
    <section className="ed-section" aria-labelledby={`offers-${venue}`}>
      <div className="ed-section__head">
        <h3 id={`offers-${venue}`}>{OFFERS_HEADING[venue]}</h3>
        <button type="button" className="btn btn--gold btn--small" onClick={add}>
          + Add new offer
        </button>
      </div>
      <p className="editor__hint">
        These only ever appear on the {VENUE_TITLE[venue].toLowerCase()}, marked "{OFFER_LABEL[venue]}". Only items shown on this menu and allowed in offers can be picked. Only enter offers the business has confirmed.
      </p>
      {offers.length === 0 ? <p className="ed-empty">No offers yet. Press "Add new offer" to create one.</p> : null}
      <div className="offer-cards">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            doc={{ ...doc, offers }}
            prices={prices}
            open={editing === offer.id}
            onToggleOpen={() => setEditing(editing === offer.id ? null : offer.id)}
            onChange={(patch) => onChange(offers.map((entry) => (entry.id === offer.id ? { ...entry, ...patch } : entry)))}
            onRemove={() => {
              if (!window.confirm(`Remove "${offer.title}"? It disappears for customers once you save and publish.`)) return;
              onChange(offers.filter((entry) => entry.id !== offer.id));
            }}
          />
        ))}
      </div>
    </section>
  );
}

/** Offer items carry the permanent item id, so a renamed item stays in its offer. */
const withItemIds = (offers: Offer[], catalogue: Catalogue): Offer[] =>
  offers.map((offer) => ({ ...offer, items: offer.items.map((entry) => (entry.itemId ? entry : { ...entry, itemId: catalogue.items.find((item) => item.name === entry.name)?.id })) }));

// ---------- One menu: sections, items, prices, order, offers ----------

function MenuTab({ venue, slots, update }: { venue: MenuVenue; slots: Slots; update: Update }) {
  const catalogue = slots.catalogue.doc;
  const config = slots[venue].doc;
  const items = new Map(catalogue.items.map((item) => [item.id, item]));
  const [adding, setAdding] = useState<string | null>(null);
  const [newSection, setNewSection] = useState("");
  // Offers only see items that are shown and allowed in offers on this menu.
  const offerDoc = useMemo(() => {
    const eligible = { ...config, entries: config.entries.filter((entry) => entry.offerEligible) };
    return renderMenu(catalogue, eligible);
  }, [catalogue, config]);
  const set = (next: MenuConfig) => update({ [venue]: next });

  const moveSection = (index: number, by: number) => {
    const sections = [...config.sections];
    const [moved] = sections.splice(index, 1);
    sections.splice(index + by, 0, moved);
    set({ ...config, sections });
  };
  const moveEntry = (entry: MenuEntry, by: number) => {
    const inSection = config.entries.filter((row) => row.sectionId === entry.sectionId);
    const at = inSection.indexOf(entry);
    const target = inSection[at + by];
    if (!target) return;
    const entries = [...config.entries];
    const a = entries.indexOf(entry);
    const b = entries.indexOf(target);
    [entries[a], entries[b]] = [entries[b], entries[a]];
    set({ ...config, entries });
  };
  const patchEntry = (itemId: string, patch: Partial<MenuEntry>) => set({ ...config, entries: config.entries.map((entry) => (entry.itemId === itemId ? { ...entry, ...patch } : entry)) });
  const unused = catalogue.categories.filter((category) => !config.sections.some((section) => section.categoryId === category.id));

  return (
    <>
      <OffersSection venue={venue} doc={offerDoc} offers={config.offers} onChange={(offers) => set({ ...config, offers: withItemIds(offers, catalogue) })} />

      <section className="ed-section" aria-labelledby={`menu-${venue}`}>
        <div className="ed-section__head">
          <h3 id={`menu-${venue}`}>{VENUE_TITLE[venue]} items</h3>
        </div>
        <p className="editor__hint">Switch items on or off, set this menu's prices, rename sections for this menu only and change the order. New items are created in Master items.</p>
        {config.sections.map((section, sectionIndex) => {
          const entries = config.entries.filter((entry) => entry.sectionId === section.id);
          const master = catalogue.categories.find((category) => category.id === section.categoryId);
          const shownCount = entries.filter((entry) => entry.visible && items.get(entry.itemId)?.status === "active").length;
          return (
            <details className="price-group" key={section.id}>
              <summary>
                {section.label} <span>({shownCount} shown of {entries.length})</span>
              </summary>
              <div className="mm-section-bar">
                <label>
                  Name on this menu
                  <input value={section.label} maxLength={40} onChange={(event) => set({ ...config, sections: config.sections.map((entry) => (entry.id === section.id ? { ...entry, label: event.target.value } : entry)) })} />
                </label>
                <small>Master category: {master?.name ?? "none"}</small>
                <div className="mm-order">
                  <button type="button" className="mini-btn" disabled={sectionIndex === 0} onClick={() => moveSection(sectionIndex, -1)} aria-label={`Move ${section.label} up`}>
                    ↑
                  </button>
                  <button type="button" className="mini-btn" disabled={sectionIndex === config.sections.length - 1} onClick={() => moveSection(sectionIndex, 1)} aria-label={`Move ${section.label} down`}>
                    ↓
                  </button>
                  {!entries.length ? (
                    <button type="button" className="mini-btn" onClick={() => set({ ...config, sections: config.sections.filter((entry) => entry.id !== section.id) })}>
                      Remove section
                    </button>
                  ) : null}
                </div>
              </div>
              <ul className="mi-list">
                {entries.map((entry, index) => {
                  const item = items.get(entry.itemId);
                  const archived = item?.status !== "active";
                  return (
                    <li key={entry.itemId} className={`mi-row mm-entry${entry.visible && !archived ? "" : " is-off"}`}>
                      <div className="mm-order">
                        <button type="button" className="mini-btn" disabled={index === 0} onClick={() => moveEntry(entry, -1)} aria-label={`Move ${item?.name} up`}>
                          ↑
                        </button>
                        <button type="button" className="mini-btn" disabled={index === entries.length - 1} onClick={() => moveEntry(entry, 1)} aria-label={`Move ${item?.name} down`}>
                          ↓
                        </button>
                      </div>
                      <div className="mi-row__text">
                        <span className="mi-row__name">{item?.name ?? "Deleted item"}</span>
                        <span className="mi-row__note">{archived ? "Archived in Master items" : item?.description ?? item?.includes?.join(", ") ?? ""}</span>
                      </div>
                      <label className="switch" title="Show on this menu">
                        <input type="checkbox" checked={entry.visible} disabled={archived} onChange={(event) => patchEntry(entry.itemId, { visible: event.target.checked })} aria-label={`Show ${item?.name} on this menu`} />
                        <span aria-hidden="true" />
                        <em>{entry.visible ? "On" : "Off"}</em>
                      </label>
                      <label className="mi-row__price">
                        £
                        <input type="number" inputMode="decimal" step="0.01" min="0" value={entry.price || ""} placeholder="0.00" onChange={(event) => patchEntry(entry.itemId, { price: money(event.target.value) || 0 })} aria-label={`Price for ${item?.name}`} />
                      </label>
                      <label className="mm-check" title="Allow this item in offers on this menu">
                        <input type="checkbox" checked={entry.offerEligible} onChange={(event) => patchEntry(entry.itemId, { offerEligible: event.target.checked })} /> Offers
                      </label>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Take ${item?.name} off this menu`}
                        onClick={() => {
                          if (!window.confirm(`Take ${item?.name} off the ${VENUE_TITLE[venue].toLowerCase()}? Its price here is forgotten. Switch it Off instead to keep the price.`)) return;
                          set({ ...config, entries: config.entries.filter((row) => row.itemId !== entry.itemId), offers: config.offers.map((offer) => ({ ...offer, items: offer.items.filter((row) => row.itemId !== entry.itemId) })) });
                        }}
                      >
                        ×
                      </button>
                      {entry.visible && !(entry.price > 0) ? <span className="mm-warn">Enter a price</span> : null}
                    </li>
                  );
                })}
              </ul>
              {adding === section.id ? (
                <MultiPicker
                  catalogue={catalogue}
                  exclude={new Set(config.entries.map((entry) => entry.itemId))}
                  filter={(item) => (master?.type === "deal") === (item.type === "deal")}
                  preferCategory={section.categoryId}
                  confirmLabel={(count) => `Add ${count} to ${section.label}`}
                  onCancel={() => setAdding(null)}
                  onConfirm={(ids) => {
                    const rows = ids.map((id) => {
                      const price = suggestedPrice(slots, id, venue);
                      return { itemId: id, sectionId: section.id, price, visible: false, offerEligible: true };
                    });
                    set({ ...config, entries: [...config.entries, ...rows] });
                    setAdding(null);
                  }}
                  note="Added items start switched Off with the price from another menu. Check each price, then switch it On."
                />
              ) : (
                <button type="button" className="mi-add-btn" onClick={() => setAdding(section.id)}>
                  + Add items from Master items to {section.label}
                </button>
              )}
            </details>
          );
        })}
        {unused.length ? (
          <div className="custom-conds__add mm-addsec">
            <select value={newSection} onChange={(event) => setNewSection(event.target.value)} aria-label="Category to add as a section">
              <option value="">Add a section to this menu...</option>
              {unused.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn--outline btn--small"
              disabled={!newSection}
              onClick={() => {
                const category = catalogue.categories.find((entry) => entry.id === newSection);
                if (category) set(sectionFor(config, category).config);
                setNewSection("");
              }}
            >
              Add section
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}

/** Search and tick several master items at once. */
function MultiPicker({
  catalogue,
  exclude,
  filter,
  preferCategory,
  confirmLabel,
  onConfirm,
  onCancel,
  note,
}: {
  catalogue: Catalogue;
  exclude: Set<string>;
  filter: (item: CatalogueItem) => boolean;
  preferCategory?: string;
  confirmLabel: (count: number) => string;
  onConfirm: (ids: string[]) => void;
  onCancel: () => void;
  note?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(preferCategory && catalogue.items.some((item) => item.categoryId === preferCategory && !exclude.has(item.id) && item.status === "active") ? preferCategory : "all");
  const [picked, setPicked] = useState<string[]>([]);
  const q = query.trim().toLowerCase();
  const usable = catalogue.items.filter((item) => item.status === "active" && !exclude.has(item.id) && filter(item));
  const categories = catalogue.categories.filter((entry) => usable.some((item) => item.categoryId === entry.id));
  const shown = usable.filter((item) => (category === "all" || item.categoryId === category) && (!q || item.name.toLowerCase().includes(q)));
  return (
    <div className="dish-picker">
      <div className="dish-picker__bar">
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search master items" aria-label="Search master items" autoFocus />
        <button type="button" className="btn btn--gold btn--small" disabled={!picked.length} onClick={() => onConfirm(picked)}>
          {picked.length ? confirmLabel(picked.length) : "Tick items to add"}
        </button>
        <button type="button" className="btn btn--outline btn--small" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {note ? <p className="editor__hint">{note}</p> : null}
      <div className="chips dish-picker__sections" role="group" aria-label="Categories">
        {[{ id: "all", name: "All" }, ...categories].map((entry) => (
          <button key={entry.id} type="button" className={`chipbtn${category === entry.id ? " is-on" : ""}`} aria-pressed={category === entry.id} onClick={() => setCategory(entry.id)}>
            {entry.name}
          </button>
        ))}
      </div>
      <ul className="dish-picker__list">
        {shown.length ? (
          shown.map((item) => {
            const on = picked.includes(item.id);
            return (
              <li key={item.id}>
                <button type="button" className={`dish-opt${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => setPicked((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]))}>
                  <span className="dish-opt__tick" aria-hidden="true">
                    {on ? "✓" : "+"}
                  </span>
                  <span className="dish-opt__name">{item.name}</span>
                  <span className="dish-opt__sec">{catalogue.categories.find((entry) => entry.id === item.categoryId)?.name}</span>
                </button>
              </li>
            );
          })
        ) : (
          <li className="picker__none">{usable.length ? `Nothing matches "${query}".` : "Every master item is already here."}</li>
        )}
      </ul>
    </div>
  );
}

// ---------- Buffet builder ----------

function BuffetBuilder({ slots, update }: { slots: Slots; update: Update }) {
  const catalogue = slots.catalogue.doc;
  const doc = slots.buffet.doc;
  const items = new Map(catalogue.items.map((item) => [item.id, item]));
  const [picking, setPicking] = useState<number | null>(null);
  const [newSection, setNewSection] = useState("");
  const groups = doc.buffet.groups;
  const inBuffet = new Set(groups.flatMap((group) => group.itemIds));

  const setDoc = (next: BuffetDoc) => {
    for (const group of next.buffet.groups) group.items = namesFor(catalogue, group.itemIds);
    update({ buffet: next });
  };
  const setInfo = (patch: Partial<BuffetInfo>) => {
    const buffet = { ...doc.buffet, ...patch } as BuffetDoc["buffet"];
    // Buffet price changes keep each buffet offer's regular price in step.
    const prices = menuPrices({ venue: "buffet", categories: [], buffet: buffet as unknown as BuffetInfo });
    const offers = doc.offers.map((offer) => ({ ...offer, items: offer.items.map((item) => ({ ...item, originalPrice: prices.get(item.name) ?? item.originalPrice })) }));
    setDoc({ ...doc, buffet, offers });
  };
  const setGroups = (next: BuffetDoc["buffet"]["groups"]) => setDoc({ ...doc, buffet: { ...doc.buffet, groups: structuredClone(next) } });
  const moveGroup = (index: number, by: number) => {
    const next = [...groups];
    const [moved] = next.splice(index, 1);
    next.splice(index + by, 0, moved);
    setGroups(next);
  };
  const moveDish = (groupIndex: number, dishIndex: number, by: number) => {
    const next = structuredClone(groups);
    const ids = next[groupIndex].itemIds;
    [ids[dishIndex], ids[dishIndex + by]] = [ids[dishIndex + by], ids[dishIndex]];
    setGroups(next);
  };
  const addSection = () => {
    const title = newSection.trim().replace(/\s+/g, " ");
    if (!title || groups.some((group) => group.title.toLowerCase() === title.toLowerCase())) return;
    setGroups([...groups, { title, items: [], itemIds: [] }]);
    setNewSection("");
    setPicking(groups.length);
  };
  const total = groups.reduce((sum, group) => sum + group.itemIds.length, 0);
  const buffetView: MenuDoc = { ...(doc as unknown as MenuDoc), buffet: { ...doc.buffet } };

  return (
    <>
      <OffersSection venue="buffet" doc={buffetView} offers={doc.offers} onChange={(offers) => setDoc({ ...doc, offers })} />

      <section className="ed-section" aria-labelledby="bb-prices">
        <div className="ed-section__head">
          <h3 id="bb-prices">Buffet prices and times</h3>
        </div>
        <p className="editor__hint">Buffet prices belong to the buffet only. Adding a dish to the buffet never gives it a price, and changing these never changes a menu price.</p>
        <div className="buffet-form">
          <label>
            Days
            <input value={doc.buffet.days} maxLength={80} onChange={(event) => setInfo({ days: event.target.value })} />
          </label>
          <label>
            Hours
            <input value={doc.buffet.hours} maxLength={80} onChange={(event) => setInfo({ hours: event.target.value })} />
          </label>
          <label>
            Adult price £
            <input type="number" inputMode="decimal" step="0.01" min="0" value={doc.buffet.adultPrice} onChange={(event) => setInfo({ adultPrice: money(event.target.value) })} />
          </label>
          <label>
            Kids price £
            <input type="number" inputMode="decimal" step="0.01" min="0" value={doc.buffet.kidsPrice} onChange={(event) => setInfo({ kidsPrice: money(event.target.value) })} />
          </label>
          <label>
            Kids note
            <input value={doc.buffet.kidsNote} maxLength={80} onChange={(event) => setInfo({ kidsNote: event.target.value })} />
          </label>
          <label>
            Booking phone
            <input value={doc.buffet.bookingPhone} maxLength={80} onChange={(event) => setInfo({ bookingPhone: event.target.value })} />
          </label>
        </div>
      </section>

      <section className="ed-section" aria-labelledby="bb-dishes">
        <div className="ed-section__head bf-head">
          <h3 id="bb-dishes">
            Buffet dishes <span className="bf-count">{total}</span>
          </h3>
          <a className="btn btn--outline btn--small" href={previewUrl.buffet} target="_blank" rel="noopener">
            Preview
          </a>
        </div>
        <p className="editor__hint">Dishes come from Master items, so renaming a dish there renames it here. Use the arrows to change the order.</p>
        <div className="bf-groups">
          {groups.map((group, index) => (
            <div className="bf-group" key={index}>
              <div className="bf-group__head">
                <input className="bf-group__title" value={group.title} maxLength={40} onChange={(event) => setGroups(groups.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))} aria-label="Section name" />
                <button type="button" className="mini-btn" disabled={index === 0} onClick={() => moveGroup(index, -1)} aria-label={`Move ${group.title} up`}>
                  ↑
                </button>
                <button type="button" className="mini-btn" disabled={index === groups.length - 1} onClick={() => moveGroup(index, 1)} aria-label={`Move ${group.title} down`}>
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Remove the ${group.title} section`}
                  onClick={() => {
                    if (group.itemIds.length && !window.confirm(`Remove the ${group.title} section and its ${group.itemIds.length} dishes from the buffet?`)) return;
                    setGroups(groups.filter((_, i) => i !== index));
                    setPicking(null);
                  }}
                >
                  ×
                </button>
              </div>
              {group.itemIds.length ? (
                <ul className="bf-dishes">
                  {group.itemIds.map((id, dishIndex) => {
                    const item = items.get(id);
                    return (
                      <li key={id} className={`bf-dish${item?.status === "active" ? "" : " is-missing"}`} title={item?.status === "active" ? undefined : "Archived or deleted in Master items, customers do not see it"}>
                        <button type="button" disabled={dishIndex === 0} aria-label={`Move ${item?.name} earlier`} onClick={() => moveDish(index, dishIndex, -1)}>
                          ‹
                        </button>
                        {item?.name ?? "Deleted item"}
                        <button type="button" disabled={dishIndex === group.itemIds.length - 1} aria-label={`Move ${item?.name} later`} onClick={() => moveDish(index, dishIndex, 1)}>
                          ›
                        </button>
                        <button type="button" aria-label={`Remove ${item?.name} from the buffet`} onClick={() => setGroups(groups.map((entry, i) => (i === index ? { ...entry, itemIds: entry.itemIds.filter((other) => other !== id) } : entry)))}>
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
                <MultiPicker
                  catalogue={catalogue}
                  exclude={inBuffet}
                  filter={(item) => item.type !== "deal"}
                  confirmLabel={(count) => `Add ${count} to ${group.title}`}
                  onCancel={() => setPicking(null)}
                  onConfirm={(ids) => {
                    setGroups(groups.map((entry, i) => (i === index ? { ...entry, itemIds: [...entry.itemIds, ...ids] } : entry)));
                    setPicking(null);
                  }}
                />
              ) : (
                <button type="button" className="mi-add-btn" onClick={() => setPicking(index)}>
                  + Add dishes to {group.title || "this section"}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="custom-conds__add bf-new">
          <input value={newSection} maxLength={40} onChange={(event) => setNewSection(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addSection())} placeholder="New buffet section, for example Grill" aria-label="New buffet section name" />
          <button type="button" className="btn btn--outline btn--small" onClick={addSection}>
            Add section
          </button>
        </div>
      </section>
    </>
  );
}
