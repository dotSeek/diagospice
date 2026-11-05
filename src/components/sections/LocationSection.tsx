import { restaurant } from "../../data/restaurant";
import { Artwork } from "../ui/Artwork";
import { Button } from "../ui/Button";
import { RestaurantMap } from "./RestaurantMap";

export function LocationSection() {
  return (
    <section id="location" aria-labelledby="location-title">
      <div className="location__head">
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
      </div>
      <RestaurantMap />
    </section>
  );
}
