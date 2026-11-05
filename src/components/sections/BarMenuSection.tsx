import { barCategoryById } from "../../data/barMenu";
import { restaurant } from "../../data/restaurant";
import { MenuCategory } from "../menu/MenuCategory";
import { MenuDownloadButton } from "../menu/MenuDownloadButton";
import { MenuShareButton } from "../menu/MenuShareButton";
import { Artwork } from "../ui/Artwork";

const category = (id: string) => <MenuCategory category={barCategoryById(id)} />;

export function BarMenuSection() {
  return (
    <section id="bar-menu" className="bar-menu" aria-labelledby="bar-menu-title">
      <div className="checker" aria-hidden="true" />
      <div className="bar-head">
        <div>
          <h2 className="display" id="bar-menu-title">
            Bar menu
          </h2>
          <p className="bar-head__text">
            Food and soft drinks from the bar, with mains served with rice or nan and burgers served with chips.
          </p>
          <div className="bar-head__actions">
            <MenuDownloadButton
              href={restaurant.barMenuPdfUrl}
              filename={restaurant.barMenuPdfFilename}
              label="Download bar menu"
            />
            <MenuShareButton url={restaurant.barMenuPageUrl} title="Diago Spice bar menu" label="Share bar menu" />
          </div>
        </div>
        <Artwork name="tankard" className="bar-head__art" />
      </div>

      <div className="menu-row">
        <div className="menu-col">
          {category("bar-starters")}
          {category("bar-nan")}
        </div>
        <div className="menu-row__line" aria-hidden="true" />
        <div className="menu-col">
          {category("bar-soup")}
          {category("bar-mains")}
          {category("bar-desserts")}
          <Artwork name="cake" className="menu-art" />
        </div>
      </div>

      <hr className="rule menu-divider" />

      <div className="menu-row">
        <div className="menu-col">
          {category("bar-specials")}
          {category("bar-burgers")}
        </div>
        <div className="menu-row__line" aria-hidden="true" />
        <div className="menu-col">
          {category("bar-rice")}
          {category("bar-chips")}
          {category("bar-soft-drinks")}
        </div>
      </div>
    </section>
  );
}
