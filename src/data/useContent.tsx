import { createContext, useContext, useEffect, useState } from "react";
import type { MenuDoc, Offer, Venue } from "./content";
import { buffet as builtInBuffet } from "./menu";

// Loads published menus and offers from the API. Every caller falls back to the built in
// static menu if the request fails, so the site never shows an empty menu.
const requests = new Map<string, Promise<unknown>>();
const load = <T,>(url: string): Promise<T> => {
  if (!requests.has(url)) requests.set(url, fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(res.status))));
  return requests.get(url) as Promise<T>;
};

export function useMenuDoc(venue: Venue, preview = false): { doc: MenuDoc | null; failed: boolean } {
  const [state, setState] = useState<{ doc: MenuDoc | null; failed: boolean }>({ doc: null, failed: false });
  useEffect(() => {
    let alive = true;
    load<MenuDoc>(`/api/menu?name=${venue}${preview ? "&draft=1" : ""}`)
      .then((doc) => alive && setState({ doc, failed: false }))
      .catch(() => alive && setState({ doc: null, failed: true }));
    return () => {
      alive = false;
    };
  }, [venue, preview]);
  return state;
}

/** Live offers per venue: undefined while loading, null if they could not load. */
export function useLiveOffers(): Record<Venue, Offer[]> | null | undefined {
  const [offers, setOffers] = useState<Record<Venue, Offer[]> | null | undefined>(undefined);
  useEffect(() => {
    load<Record<Venue, Offer[]>>("/api/offers").then(setOffers).catch(() => setOffers(null));
  }, []);
  return offers;
}

/** Offer price lookup for highlighting discounted dishes inside a menu list. */
export interface ItemOffer {
  offerPrice: number;
  label: string;
}
export const ItemOffersContext = createContext<Map<string, ItemOffer>>(new Map());
export const useItemOffer = (name: string): ItemOffer | undefined => useContext(ItemOffersContext).get(name);

/** Weekend buffet as published on the restaurant menu (admin editable), else the built in one. */
export function useBuffet(): typeof builtInBuffet {
  const { doc } = useMenuDoc("restaurant");
  const published = doc?.buffet;
  if (!published) return builtInBuffet;
  return {
    ...builtInBuffet,
    days: published.days,
    hours: published.hours,
    bookingPhone: published.bookingPhone,
    adultPrice: published.adultPrice,
    kidsPrice: published.kidsPrice,
    kidsNote: published.kidsNote,
  };
}
