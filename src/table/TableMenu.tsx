
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { formatPrice } from "../data/menu";
import { OFFER_LABEL } from "../data/content";
import { ItemOffersContext, useMenuDoc } from "../data/useContent";
import type { ItemOffer } from "../data/useContent";
import { restaurant } from "../data/restaurant";
import { MenuCategory } from "../components/menu/MenuCategory";
import { PromotionCard } from "../components/offers/PromotionCard";
import { RevealGroup } from "../components/motion/Reveal";

/**
 * QR table menu (/restaurant-menu/ and /bar-menu/). Guests scan the code on their table, browse
 * on their phone and order with the staff. The menu loads from /api/menu, so a menu or offer
 * update reaches the same printed QR code without reprinting.
 */
type Venue = "restaurant" | "bar";

// ?preview=1 shows the unpublished draft to a signed in admin (the API refuses everyone else).
const preview = new URLSearchParams(location.search).get("preview") === "1";

// `updated` is a date (built in menus) or a full timestamp (admin saves); only the day is shown.
export function TableMenu({ venue }: { venue: Venue }) {
  const { doc: data, failed } = useMenuDoc(venue, preview);
  // Offers arrive already filtered to this venue's live ones. Bar and restaurant never mix.
  const offers = data?.offers ?? [];
  const itemOffers = new Map<string, ItemOffer>();
  for (const offer of offers) for (const item of offer.items) itemOffers.set(item.name, { offerPrice: item.offerPrice, label: OFFER_LABEL[venue] });

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
      <ItemOffersContext.Provider value={itemOffers}>
        <div className="table-page">
          {preview ? <p className="table-preview">Draft preview. Customers cannot see this until it is published.</p> : null}
          <header className="table-head">
            <img className="table-head__logo" src="/brand/logo.webp" alt="Diago Spice logo" width={640} height={731} />
            <p className="script">Welcome to Diago Spice</p>
            <h1 className="display table-head__title">{venue === "bar" ? "Bar menu" : "Restaurant menu"}</h1>
            {data ? <p className="table-head__note">{data.note}</p> : null}
            {data ? (
              <nav className="menu-jump" aria-label="Menu sections">
                {data.categories.map((category) => (
                  <a key={category.id} href={`#${category.id}`}>
                    {category.label}
                  </a>
                ))}
              </nav>
            ) : null}
          </header>

          {offers.length ? (
            <section className="table-offers" aria-labelledby="table-offers-title">
              <h2 className="dish-title table-offers__title" id="table-offers-title">
                Grand Opening Special Offers
              </h2>
              <RevealGroup className="promos__grid" stagger={0.12}>
                {offers.map((offer) => (
                  <PromotionCard key={offer.id} offer={offer} showCta={false} />
                ))}
              </RevealGroup>
            </section>
          ) : null}

          <main className="table-menu">
            {failed ? (
              <p className="table-status">Sorry, the menu could not load. Please ask a member of staff.</p>
            ) : !data ? (
              <p className="table-status">Loading the menu...</p>
            ) : (
              <>
                {data.buffet ? (
                  <div className="buffet-strip table-buffet">
                    <span className="buffet-strip__badge">Weekend buffet</span>
                    <span className="buffet-strip__item">{data.buffet.days}</span>
                    <span className="buffet-strip__item">{data.buffet.hours}</span>
                    <span className="buffet-strip__item">
                      <b>{formatPrice(data.buffet.adultPrice)}</b> adults
                    </span>
                    <span className="buffet-strip__item">
                      <b>{formatPrice(data.buffet.kidsPrice)}</b> kids under 10
                    </span>
                  </div>
                ) : null}
                <div className="table-grid">
                  {data.categories.map((category) => (
                    <MenuCategory key={category.id} category={category} />
                  ))}
                </div>
              </>
            )}
          </main>

          <footer className="table-foot">
            <p className="table-foot__order">{venue === "bar" ? "Please order at the bar." : "Please order with our staff."}</p>
            <p>
              {restaurant.name}, {restaurant.addressInline}
              <br />
              <a href={restaurant.phoneHref}>{restaurant.phoneDisplay}</a> | <a href="/">{restaurant.websiteDisplay}</a>
            </p>
            {data ? <p className="table-foot__updated">Menu updated {new Date(`${data.updated.slice(0, 10)}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p> : null}
          </footer>
        </div>
      </ItemOffersContext.Provider>
      </LazyMotion>
    </MotionConfig>
  );
}
