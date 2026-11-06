import { galleryImages, heroImage } from "../../data/images";
import type { Venue } from "../../data/content";
import { useLiveOffers } from "../../data/useContent";
import { Reveal, RevealGroup } from "../motion/Reveal";
import { PromotionCard } from "./PromotionCard";

const photo: Record<Venue, string> = {
  delivery: galleryImages.find((image) => image.caption === "Burgers")?.thumb ?? heroImage,
  restaurant: galleryImages.find((image) => image.caption === "Curry and nan")?.thumb ?? heroImage,
  bar: galleryImages.find((image) => image.caption === "Bar atmosphere")?.thumb ?? heroImage,
};

/**
 * Grand Opening Specials: one card per live offer, in delivery, restaurant, bar order.
 * Renders nothing until an admin publishes a fully confirmed offer.
 */
export function GrandOpeningSpecials() {
  const offers = useLiveOffers();
  const live = offers ? [...offers.delivery, ...offers.restaurant, ...offers.bar] : [];
  if (!live.length) return null;
  return (
    <section id="grand-opening" className="section-block promos" aria-labelledby="grand-opening-title">
      <Reveal className="section-head" effect="slideLeft">
        <p className="script">Celebrate with us</p>
        <h2 className="display" id="grand-opening-title">
          Grand Opening Specials
        </h2>
        <p className="promos__lead">Discover our special opening offers at Diago Spice Resto Bar.</p>
      </Reveal>
      <RevealGroup className="promos__grid" stagger={0.12}>
        {live.map((offer) => (
          <PromotionCard key={`${offer.venue}-${offer.id}`} offer={offer} image={photo[offer.venue]} />
        ))}
      </RevealGroup>
    </section>
  );
}

/** Grand Opening Food Offers: dine in restaurant food offers only, never delivery or bar. */
export function GrandOpeningFoodOffers() {
  const offers = useLiveOffers();
  const food = offers?.restaurant ?? [];
  if (!food.length) return null;
  return (
    <section id="food-offers" className="section-block promos" aria-labelledby="food-offers-title">
      <Reveal className="section-head" effect="slideLeft">
        <h2 className="display" id="food-offers-title">
          Grand Opening Food Offers
        </h2>
        <p className="promos__lead">Dine in only. Delivery orders and bar drinks are not included.</p>
      </Reveal>
      <RevealGroup className="promos__grid" stagger={0.12}>
        {food.map((offer) => (
          <PromotionCard key={offer.id} offer={offer} image={photo.restaurant} />
        ))}
      </RevealGroup>
    </section>
  );
}
