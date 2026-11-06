import { buffet, formatPrice } from "../../data/menu";
import { restaurant } from "../../data/restaurant";
import { Artwork } from "../ui/Artwork";
import { Stamp } from "../ui/Stamp";
import { Reveal } from "../motion/Reveal";

export function BuffetMenu() {
  return (
    <div id={buffet.id}>
      <Reveal className="buffet-head" effect="slideLeft">
        <h3 className="display">Buffet menu</h3>
        <Stamp top="DIAGO SPICE" middle="FRI SAT SUN" bottom="CLASE, SWANSEA" />
      </Reveal>
      <div className="buffet-grid">
        <div>
          <p className="dropcap">
            Every {buffet.days}, {buffet.hours}. For booking call{" "}
            <a className="link-red" href={restaurant.phoneHref}>
              {buffet.bookingPhone}
            </a>
            .
          </p>
          <div className="buffet-prices">
            <p className="buffet-price">
              <strong>{formatPrice(buffet.adultPrice)}</strong>
              Adults
            </p>
            <p className="buffet-price">
              <strong>{formatPrice(buffet.kidsPrice)}</strong>
              {buffet.kidsNote}
            </p>
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
    </div>
  );
}
