import type { ReactNode } from "react";
import { heroImage } from "../../data/images";
import { buffet, formatPrice } from "../../data/menu";
import { restaurant } from "../../data/restaurant";
import { BadgeIcon } from "../ui/BadgeIcon";
import { Button } from "../ui/Button";
import { Reveal } from "../motion/Reveal";

const chips = ["Meal deals", "Weekend buffet"];

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
      <Reveal effect="zoom" duration={0.9}>
      <h1 className="hero__word" aria-label="Diago Spice">
        <span aria-hidden="true">Diago</span>
        <span className="hero__badge" aria-hidden="true">
          <BadgeIcon className="badge-icon" />
        </span>
        <span aria-hidden="true">Spice</span>
      </h1>
      </Reveal>
      <hr className="rule" />
      <Reveal as="p" className="buffet-strip" effect="flipDown" delay={0.25}>
        <span className="buffet-strip__badge">Weekend buffet</span>
        <span className="buffet-strip__item">{buffet.days}</span>
        <span className="buffet-strip__item">{buffet.hours}</span>
        <span className="buffet-strip__item">
          <b>{formatPrice(buffet.adultPrice)}</b> adults
        </span>
        <span className="buffet-strip__item">
          <b>{formatPrice(buffet.kidsPrice)}</b> kids under 10
        </span>
      </Reveal>
      <div className="hero__photo" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero__copy">
          <Reveal as="p" className="script" effect="slideLeft" delay={0.15}>
            Welcome to Diago Spice
          </Reveal>
          <Reveal as="p" className="hero__headline" delay={0.25}>
            Frontier spirit.
            <br />
            <span className="gold-text">Serious spice.</span>
          </Reveal>
          <Reveal as="p" className="hero__lead" delay={0.3}>
            Where Indian Spice Meets the Wild West!
          </Reveal>
          <Reveal as="p" className="hero__text" delay={0.38}>
            Pull up a chair on Pengwern Road, Clase, for sizzling kottu, dum biryani, rich curries, juicy
            burgers and fiery wings.
          </Reveal>
          <Reveal as="p" className="hero__closing" delay={0.44}>
            Desi Spice. Western Soul. Big Flavours!{" "}
            <span role="img" aria-label="cowboy">
              🤠
            </span>
          </Reveal>
          <Reveal as="ul" className="chips" delay={0.45}>
            {chips.map((chip) => (
              <li className="chip" key={chip}>
                {chip}
              </li>
            ))}
          </Reveal>
          <Reveal className="hero__actions" delay={0.55}>
            <Button variant="primary" href="#menu">
              Explore our menu
            </Button>
            <Button variant="gold" href={restaurant.whatsappUrl} target="_blank" rel="noopener noreferrer">
              Order via WhatsApp
            </Button>
          </Reveal>
          <div className="info-cards">
            <Reveal effect="flipCard" delay={0.65}>
            <div className="info-card">
              {icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
              <span>
                <span className="info-card__label">Buffet</span>
                Fri to Sun, {buffet.hours}
              </span>
            </div>
            </Reveal>
            <Reveal effect="flipCard" delay={0.75}>
            <a className="info-card" href={restaurant.directionsUrl} target="_blank" rel="noopener noreferrer">
              {icon(<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.500" /></>)}
              <span>
                <span className="info-card__label">Location</span>
                Clase, Swansea
              </span>
            </a>
            </Reveal>
            <Reveal effect="flipCard" delay={0.85}>
            <a className="info-card" href={restaurant.phoneHref}>
              {icon(<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />)}
              <span>
                <span className="info-card__label">Call to order</span>
                {restaurant.phoneDisplay}
              </span>
            </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
