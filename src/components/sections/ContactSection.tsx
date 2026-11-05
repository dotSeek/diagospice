import { buffet } from "../../data/menu";
import { restaurant } from "../../data/restaurant";
import { Artwork } from "../ui/Artwork";
import { RedBlock } from "../ui/SectionHeading";
import { SocialLinks } from "../ui/SocialLinks";

export function ContactSection() {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <RedBlock kicker="Book now" title="Reserve" id="contact-title" />
      <Artwork name="telephone" className="contact__art" />
      <a className="contact__phone" href={restaurant.phoneHref}>
        {restaurant.phoneDisplay}
      </a>
      <div className="detail">
        <span className="detail__label">Buffet times</span>
        {buffet.days}
        <br />
        {buffet.hours}
      </div>
      <div className="detail">
        <span className="detail__label">Address</span>
        {restaurant.addressLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
      <div className="detail">
        <span className="detail__label">Website</span>
        <a className="link-red" href={restaurant.websiteUrl}>
          {restaurant.websiteDisplay}
        </a>
      </div>
      <SocialLinks className="social-links--stacked" />
    </section>
  );
}
