import { formatPrice } from "../../data/menu";
import { OFFER_LABEL } from "../../data/content";
import { useBuffet } from "../../data/useContent";
import type { BuffetPrice } from "../../data/useContent";
import { restaurant } from "../../data/restaurant";
import { Artwork } from "../ui/Artwork";
import { Stamp } from "../ui/Stamp";
import { Reveal, RevealGroup } from "../motion/Reveal";
import { PromotionCard } from "../offers/PromotionCard";

/** A buffet price, struck through with the Buffet Special price beside it while an offer is live. */
export function BuffetPriceText({ value }: { value: BuffetPrice }) {
  if (value.offerPrice === undefined) return <b>{formatPrice(value.price)}</b>;
  return (
    <>
      <s aria-label={`Regular price ${formatPrice(value.price)}`}>{formatPrice(value.price)}</s>{" "}
      <b aria-label={`Offer price ${formatPrice(value.offerPrice)}`}>{formatPrice(value.offerPrice)}</b>
    </>
  );
}

/**
 * Buffet Special Menu: its own section with its own prices and offers, kept apart from the
 * restaurant and bar menus. Shown on the website and on the restaurant QR menu (same QR code).
 */
export function BuffetMenu({ preview = false }: { preview?: boolean }) {
  const buffet = useBuffet(preview);
  const onOffer = buffet.adult.offerPrice !== undefined || buffet.kids.offerPrice !== undefined;
  const price = (value: BuffetPrice, label: string) => (
    <p className={`buffet-price${value.offerPrice !== undefined ? " is-offer" : ""}`}>
      <strong>
        <BuffetPriceText value={value} />
      </strong>
      {label}
    </p>
  );
  return (
    <div id={buffet.id} className="buffet-menu">
      <Reveal className="buffet-head" effect="slideLeft">
        <h3 className="display">Buffet Special Menu</h3>
        <Stamp top="DIAGO SPICE" middle="FRI SAT SUN" bottom="CLASE, SWANSEA" />
      </Reveal>
      <div className="buffet-grid">
        <div>
          {onOffer ? <span className="offer-badge offer-badge--buffet">{OFFER_LABEL.buffet}</span> : null}
          <p className="dropcap">
            Every {buffet.days}, {buffet.hours}. For booking call{" "}
            <a className="link-red" href={restaurant.phoneHref}>
              {buffet.bookingPhone}
            </a>
            .
          </p>
          <div className="buffet-prices">
            {price(buffet.adult, "Adults")}
            {price(buffet.kids, buffet.kidsNote)}
          </div>
          <Artwork name="cloche" className="menu-art menu-art--left" />
        </div>
        <div className="buffet-groups">
          {buffet.groups.map((group, index) => (
            <Reveal className="buffet-group" key={group.title} effect="flipDown" delay={index * 0.08}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
      {buffet.offers.length ? (
        <RevealGroup className="promos__grid buffet-offers" stagger={0.12}>
          {buffet.offers.map((offer) => (
            <PromotionCard key={offer.id} offer={offer} showCta={false} />
          ))}
        </RevealGroup>
      ) : null}
    </div>
  );
}
