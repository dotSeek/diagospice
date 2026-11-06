import { OFFER_LABEL } from "../../data/content";
import type { Venue } from "../../data/content";

/** Pill that says which menu an offer belongs to, so offers are never confused. */
export function OfferBadge({ venue }: { venue: Venue }) {
  return <span className={`offer-badge offer-badge--${venue}`}>{OFFER_LABEL[venue]}</span>;
}
