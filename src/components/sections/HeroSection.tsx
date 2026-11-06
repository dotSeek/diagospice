import type { ReactNode } from "react";
import { heroImage } from "../../data/images";
import { buffet, delivery, formatPrice } from "../../data/menu";
import { restaurant } from "../../data/restaurant";
import { BadgeIcon } from "../ui/BadgeIcon";
import { Button } from "../ui/Button";

const chips = [
  delivery.freeDelivery,
  `Minimum order ${delivery.minimumOrder}`,
  "Order via WhatsApp",
  "Meal deals",
  "Weekend buffet",
];

const icon = (path: ReactNode) => (
  <span className="info-card__icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  </span>
);

export function HeroSection() {
  return (
    <section id="home" className="hero">
      <hr className="rule" />
      <h1 className="hero__word" aria-label="Diago Spice">
        <span aria-hidden="true">Diago</span>
        <span className="hero__badge" aria-hidden="true">
          <BadgeIcon className="badge-icon" />
        </span>
        <span aria-hidden="true">Spice</span>
      </h1>
      <hr className="rule" />
      <p className="hero__tag">
        Buffet {buffet.days}, adults {formatPrice(buffet.adultPrice)}, kids under 10 {formatPrice(buffet.kidsPrice)}
      </p>
      <div className="hero__photo" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero__copy">
          <p className="script">Welcome to Diago Spice</p>
          <p className="hero__headline">
            Frontier spirit.
            <br />
            <span className="gold-text">Serious spice.</span>
          </p>
          <p>
            Pull up a chair on Pengwern Road in Clase for kottu, dum biriyani, rich curries, burgers and
            wings, served in the spirit of the old American West.
          </p>
          <ul className="chips" aria-label="Highlights">
            {chips.map((chip) => (
              <li className="chip" key={chip}>
                {chip}
              </li>
            ))}
          </ul>
          <div className="hero__actions">
            <Button variant="primary" href="#menu">
              Explore our menu
            </Button>
            <Button variant="gold" href={restaurant.whatsappUrl} target="_blank" rel="noopener noreferrer">
              Order via WhatsApp
            </Button>
          </div>
          <div className="info-cards">
            <div className="info-card">
              {icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
              <span>
                <span className="info-card__label">Buffet</span>
                Fri to Sun, {buffet.hours}
              </span>
            </div>
            <a className="info-card" href={restaurant.directionsUrl} target="_blank" rel="noopener noreferrer">
              {icon(<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.500" /></>)}
              <span>
                <span className="info-card__label">Location</span>
                Clase, Swansea
              </span>
            </a>
            <a className="info-card" href={restaurant.phoneHref}>
              {icon(<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />)}
              <span>
                <span className="info-card__label">Call to order</span>
                {restaurant.phoneDisplay}
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
