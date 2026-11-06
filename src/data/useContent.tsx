import { createContext, useContext, useEffect, useState } from "react";
import { BUFFET_ADULT, BUFFET_KIDS } from "./content";
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

/** One buffet price, with the live Buffet Special offer price when there is one. */
export interface BuffetPrice {
  price: number;
  offerPrice?: number;
}

/**
 * The Buffet Special Menu as published (its own document, admin editable), else the built in one.
 * Prices and live buffet offers come only from the buffet document, never from restaurant prices.
 */
export function useBuffet(preview = false) {
  const { doc } = useMenuDoc("buffet", preview);
  const published = doc?.buffet;
  const info = published
    ? {
        ...builtInBuffet,
        days: published.days,
        hours: published.hours,
        bookingPhone: published.bookingPhone,
        adultPrice: published.adultPrice,
        kidsPrice: published.kidsPrice,
        kidsNote: published.kidsNote,
        groups: published.groups ?? builtInBuffet.groups,
      }
    : builtInBuffet;
  const offers: Offer[] = doc?.offers ?? [];
  const priceOf = (name: string, price: number): BuffetPrice => {
    const item = offers.flatMap((offer) => offer.items).find((entry) => entry.name === name && entry.offerPrice < price);
    return item ? { price, offerPrice: item.offerPrice } : { price };
  };
  return { ...info, offers, adult: priceOf(BUFFET_ADULT, info.adultPrice), kids: priceOf(BUFFET_KIDS, info.kidsPrice) };
}
