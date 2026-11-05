import { useEffect, useState } from "react";
import { restaurant } from "../../data/restaurant";
import { PhoneIcon } from "../ui/PhoneIcon";
import { Navigation } from "./Navigation";
import { ReserveCard } from "./ReserveCard";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`topbar ${scrolled ? "is-solid" : ""}`.trim()}>
        <button
          type="button"
          className="menu-circle"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          Menu
        </button>
        <a className="logo-card" href="#home" aria-label={`${restaurant.name} home`}>
          <img src="/brand/logo-small.webp" alt="" width={240} height={274} />
          <span className="logo-card__subtitle">Clase, Swansea</span>
        </a>
        <button
          type="button"
          className="reserve-button"
          aria-haspopup="dialog"
          aria-expanded={reserveOpen}
          onClick={() => setReserveOpen(true)}
        >
          <span className="reserve-button__icon">
            <PhoneIcon />
          </span>
          <span className="reserve-button__text">
            <span className="reserve-button__label">Reserve</span>
            <span className="reserve-button__phone">{restaurant.phoneDisplay}</span>
          </span>
        </button>
      </header>
      <Navigation open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ReserveCard open={reserveOpen} onClose={() => setReserveOpen(false)} />
    </>
  );
}
