import type { ArtName } from "../../data/artwork";
import { categoryById, delivery } from "../../data/menu";
import { Artwork } from "../ui/Artwork";
import { BuffetMenu } from "../menu/BuffetMenu";
import { MenuCategory } from "../menu/MenuCategory";
import { MenuCategoryTabs } from "../menu/MenuCategoryTabs";
import { MenuDownloadButton } from "../menu/MenuDownloadButton";
import { MenuShareButton } from "../menu/MenuShareButton";
import { Button } from "../ui/Button";
import { restaurant } from "../../data/restaurant";

const category = (id: string, art?: ArtName) => <MenuCategory category={categoryById(id)} art={art} />;

export function MenuSection() {
  return (
    <section id="menu" aria-labelledby="menu-title">
      <div className="menu-hero">
        <hr className="rule" />
        <h2 className="display" id="menu-title">
          Menu
        </h2>
        <hr className="rule" />
      </div>
      <p className="menu-tagline">Delivery menu</p>
      <p className="menu-delivery">
        {delivery.howToOrder} {delivery.freeDelivery}. Minimum order {delivery.minimumOrder}.
      </p>
      <MenuCategoryTabs />
      <div className="menu-download">
        <Button href={restaurant.whatsappUrl} target="_blank" rel="noopener noreferrer" variant="primary">
          Order on WhatsApp
        </Button>
        <MenuDownloadButton />
        <MenuShareButton url={restaurant.menuPageUrl} title="Diago Spice menu" label="Share menu" />
      </div>

      <div className="menu-row">
        <div className="menu-col">
          {category("starters")}
          {category("nan")}
          <Artwork name="chilli" className="menu-art" />
        </div>
        <div className="menu-row__line" aria-hidden="true" />
        <div className="menu-col">
          {category("meal-deals", "burger")}
          {category("mains")}
        </div>
      </div>

      <hr className="rule menu-divider" />

      <div className="menu-row">
        <div className="menu-col">{category("specials")}</div>
        <div className="menu-row__line" aria-hidden="true" />
        <div className="menu-col">
          {category("rice")}
          <Artwork name="bowl" className="menu-art" />
        </div>
      </div>

      <hr className="rule menu-divider" />

      <div className="menu-row-3">
        <div className="menu-col">
          {category("burgers")}
          {category("desserts")}
        </div>
        {category("rice-curry-deals")}
        <div className="menu-col">
          {category("chips")}
          <Artwork name="fries" className="menu-art" />
        </div>
      </div>

      <div className="checker" aria-hidden="true" />
      <BuffetMenu />
    </section>
  );
}
