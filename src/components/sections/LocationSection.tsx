import { restaurant } from "../../data/restaurant";
import { Artwork } from "../ui/Artwork";
import { Button } from "../ui/Button";
import { RestaurantMap } from "./RestaurantMap";
import { Reveal } from "../motion/Reveal";

export function LocationSection() {
  return (
    <section id="location" aria-labelledby="location-title">
      <Reveal className="location__head" effect="slideLeft">
        <div>
          <h2 className="display" id="location-title" style={{ fontSize: "clamp(44px, 8cqw, 140px)" }}>
            Find us
          </h2>
          <address className="location__address">{restaurant.addressInline}</address>
          <Button href={restaurant.directionsUrl} target="_blank" rel="noopener noreferrer">
            Get directions
          </Button>
        </div>
        <Artwork name="compass" className="location__art" />
      </Reveal>
      <Reveal effect="zoom" delay={0.1}>
        <RestaurantMap />
      </Reveal>
    </section>
  );
}
