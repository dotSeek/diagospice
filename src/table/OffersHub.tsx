import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { Offer } from "../data/content";
import { useLiveOffers } from "../data/useContent";
import { restaurant } from "../data/restaurant";
import { PromotionCard } from "../components/offers/PromotionCard";
import { RevealGroup } from "../components/motion/Reveal";

/**
 * /offers/ : the one page behind the entrance poster's single QR code. It shows the restaurant
 * offers and the bar offers that are live right now, each in its own section with a link to its
 * own full menu, so the two menus stay separate. With no live offers it simply points to the menus.
 */
const SECTIONS = [
  { venue: "restaurant", title: "Restaurant offers", menu: "/restaurant-menu/", menuLabel: "Restaurant menu", empty: "No restaurant offers right now. Our full food menu is always worth a look." },
  { venue: "bar", title: "Bar offers", menu: "/bar-menu/", menuLabel: "Bar menu", empty: "No bar offers right now. See our full drinks and bar food menu." },
] as const;

export function OffersHub() {
  const live = useLiveOffers();
  const loading = live === undefined;

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <div className="table-page">
          <header className="table-head">
            <img className="table-head__logo" src="/brand/logo.webp" alt="Diago Spice logo" width={640} height={731} />
            <p className="script">Welcome to Diago Spice</p>
            <h1 className="display table-head__title">Special offers</h1>
            <p className="table-head__note">Restaurant and bar. Always the latest offers and prices.</p>
            <nav className="hub-pick" aria-label="Menus">
              {SECTIONS.map((section, index) => (
                <a key={section.venue} className={`btn ${index === 0 ? "btn--gold" : "btn--outline"}`} href={section.menu}>
                  {section.menuLabel}
                </a>
              ))}
            </nav>
          </header>

          <main className="hub">
            {SECTIONS.map((section) => {
              const offers: Offer[] = live?.[section.venue] ?? [];
              return (
                <section key={section.venue} className="table-offers hub__section" aria-labelledby={`hub-${section.venue}`}>
                  <h2 className="dish-title table-offers__title" id={`hub-${section.venue}`}>
                    {section.title}
                  </h2>
                  {loading ? (
                    <p className="table-status">Loading offers...</p>
                  ) : live === null ? (
                    <div className="hub__empty">
                      <p>Sorry, the offers could not load just now. The full menu has the latest prices.</p>
                      <a className="btn btn--outline" href={section.menu}>
                        See the {section.menuLabel.toLowerCase()}
                      </a>
                    </div>
                  ) : offers.length ? (
                    <RevealGroup className="promos__grid" stagger={0.12}>
                      {offers.map((offer) => (
                        <PromotionCard key={offer.id} offer={offer} />
                      ))}
                    </RevealGroup>
                  ) : (
                    <div className="hub__empty">
                      <p>{section.empty}</p>
                      <a className="btn btn--outline" href={section.menu}>
                        See the {section.menuLabel.toLowerCase()}
                      </a>
                    </div>
                  )}
                </section>
              );
            })}
          </main>

          <footer className="table-foot">
            <p className="table-foot__order">Dine in at the restaurant or join us at the bar.</p>
            <p>
              {restaurant.name}, {restaurant.addressInline}
              <br />
              <a href={restaurant.phoneHref}>{restaurant.phoneDisplay}</a> | <a href="/">{restaurant.websiteDisplay}</a>
            </p>
          </footer>
        </div>
      </LazyMotion>
    </MotionConfig>
  );
}
