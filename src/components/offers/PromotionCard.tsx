import { formatPrice } from "../../data/menu";
import type { Offer, Venue } from "../../data/content";
import { restaurant } from "../../data/restaurant";
import { RevealItem } from "../motion/Reveal";
import { OfferBadge } from "./OfferBadge";
import { OfferTerms } from "./OfferTerms";

const external = (href: string) => /^https?:/.test(href);

const CTA: Record<Venue, { label: string; href: string }> = {
  delivery: { label: "Order now", href: restaurant.whatsappUrl },
  restaurant: { label: "Explore restaurant menu", href: "/restaurant-menu/" },
  bar: { label: "Explore bar menu", href: "/bar-menu/" },
  buffet: { label: "See the buffet menu", href: "/restaurant-menu/#buffet" },
};

/** One confirmed offer: photo, menu badge, value, dishes, terms and a call to action. */
export function PromotionCard({ offer, image, showCta = true }: { offer: Offer; image?: string; showCta?: boolean }) {
  return (
    <RevealItem as="article" className={`promo-card promo-card--${offer.venue}`} effect="flipCard">
      {image ? <img className="promo-card__img" src={image} alt="" loading="lazy" /> : null}
      <div className="promo-card__body">
        <OfferBadge venue={offer.venue} />
        <h3 className="promo-card__title">{offer.title}</h3>
        <p className="promo-card__value">{offer.value}</p>
        <p className="promo-card__desc">{offer.description}</p>
        {offer.items.length ? (
          <ul className="promo-card__items">
            {offer.items.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <span className="promo-card__prices">
                  <s aria-label={`Regular price ${formatPrice(item.originalPrice)}`}>{formatPrice(item.originalPrice)}</s>
                  <b aria-label={`Offer price ${formatPrice(item.offerPrice)}`}>{formatPrice(item.offerPrice)}</b>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <OfferTerms conditions={offer.conditions} expires={offer.expires} />
        {showCta ? (
        <a
          className="button button--gold promo-card__cta"
          href={CTA[offer.venue].href}
          {...(external(CTA[offer.venue].href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          <span className="button__inner">{CTA[offer.venue].label}</span>
        </a>
        ) : null}
      </div>
    </RevealItem>
  );
}
