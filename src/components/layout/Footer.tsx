import { navLinks, restaurant } from "../../data/restaurant";
import { BadgeIcon } from "../ui/BadgeIcon";
import { SocialLinks } from "../ui/SocialLinks";
import { Reveal } from "../motion/Reveal";

export function Footer() {
  return (
    <footer className="footer">
      <Reveal className="footer__grid" effect="rise" amount={0.15}>
        <div>
          <img className="footer__logo" src="/brand/logo.webp" alt={`${restaurant.name} logo`} width={640} height={731} loading="lazy" />
          <p>Curries, kottu, biriyani, burgers and wings, with a buffet from Friday to Sunday.</p>
        </div>
        <div>
          <h2 className="footer__title">Pages</h2>
          <ul className="footer__list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>
                  <BadgeIcon className="footer__icon" />
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href={restaurant.menuPdfUrl} download={restaurant.menuPdfFilename}>
                Download the menu
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer__title">Socials</h2>
          <SocialLinks className="social-links--stacked footer__social" />
          <ul className="footer__list">
            <li>
              <a href={restaurant.phoneHref}>{restaurant.phoneDisplay}</a>
            </li>
            <li>
              <a href={restaurant.websiteUrl}>{restaurant.websiteDisplay}</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer__title">Address</h2>
          <address className="footer__list">
            {restaurant.addressLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
        </div>
      </Reveal>
      <p className="footer__legal">
        © {new Date().getFullYear()} {restaurant.name}. All rights reserved.
      </p>
    </footer>
  );
}
