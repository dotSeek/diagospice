import { heroImage } from "../../data/images";
import { buffet, formatPrice } from "../../data/menu";
import { BadgeIcon } from "../ui/BadgeIcon";
import { Button } from "../ui/Button";

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
          <p className="hero__headline">Frontier spirit. Serious spice.</p>
          <p>
            Pull up a chair on Pengwern Road in Clase for kottu, dum biriyani, rich curries, burgers and
            wings, served in the spirit of the old American West.
          </p>
          <div className="hero__actions">
            <Button variant="primary" href="#menu">
              Explore our menu
            </Button>
            <Button variant="light" href="#location">
              Find us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
