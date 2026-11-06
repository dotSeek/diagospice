import type { ArtName } from "../../data/artwork";
import { categoryById } from "../../data/menu";
import { OFFER_LABEL } from "../../data/content";
import { ItemOffersContext, useMenuDoc } from "../../data/useContent";
import type { ItemOffer } from "../../data/useContent";
import { Artwork } from "../ui/Artwork";
import { BuffetMenu } from "../menu/BuffetMenu";
import { MenuCategory } from "../menu/MenuCategory";
import { MenuCategoryTabs } from "../menu/MenuCategoryTabs";
import { MenuDownloadButton } from "../menu/MenuDownloadButton";
import { MenuShareButton } from "../menu/MenuShareButton";
import { Button } from "../ui/Button";
import { WhatsAppOrderCard } from "../menu/WhatsAppOrderCard";
import { restaurant } from "../../data/restaurant";
import { Reveal } from "../motion/Reveal";

export function MenuSection() {
  // Published delivery menu from the admin dashboard; the built in menu until it loads or if it fails.
  const preview = typeof location !== "undefined" && new URLSearchParams(location.search).get("preview") === "1";
  const { doc } = useMenuDoc("delivery", preview);
  const category = (id: string, art?: ArtName) => (
    <MenuCategory category={doc?.categories.find((entry) => entry.id === id) ?? categoryById(id)} art={art} />
  );
  const itemOffers = new Map<string, ItemOffer>();
  for (const offer of doc?.offers ?? []) for (const item of offer.items) itemOffers.set(item.name, { offerPrice: item.offerPrice, label: OFFER_LABEL.delivery });
  return (
    <ItemOffersContext.Provider value={itemOffers}>
    <section id="menu" aria-labelledby="menu-title">
      <Reveal className="menu-hero" effect="zoom">
        <hr className="rule" />
        <h2 className="display" id="menu-title">
          Menu
        </h2>
        <hr className="rule" />
      </Reveal>
      <p className="menu-tagline">Delivery menu</p>
      <MenuCategoryTabs />
      <div className="menu-download">
        <Button href={restaurant.whatsappUrl} target="_blank" rel="noopener noreferrer" variant="primary">
          Order via WhatsApp
        </Button>
        <MenuDownloadButton />
        <MenuShareButton url={restaurant.menuPageUrl} title="Diago Spice menu" label="Share menu" />
      </div>
      <WhatsAppOrderCard />

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
    </ItemOffersContext.Provider>
  );
}
