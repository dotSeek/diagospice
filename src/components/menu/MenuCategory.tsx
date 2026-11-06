import type { ArtName } from "../../data/artwork";
import type { MenuCategoryData } from "../../data/menu";
import { Artwork } from "../ui/Artwork";
import { DishTitle } from "../ui/SectionHeading";
import { MenuItem } from "./MenuItem";
import { MenuItemCard } from "./MenuItemCard";
import { Reveal, RevealGroup } from "../motion/Reveal";

interface MenuCategoryProps {
  category: MenuCategoryData;
  art?: ArtName;
}

export function MenuCategory({ category, art }: MenuCategoryProps) {
  if (category.kind === "deals") {
    return (
      <Reveal className="stroke-card" id={category.id} effect="zoom">
        <div className="stroke-card__inner">
          <DishTitle>{category.label}</DishTitle>
          <div className="title-rule" aria-hidden="true">
            <span className="diamond" />
          </div>
          <RevealGroup stagger={0.12}>
            {category.deals.map((deal) => (
              <MenuItemCard key={deal.name} deal={deal} />
            ))}
          </RevealGroup>
          {art ? <Artwork name={art} className="menu-art" /> : null}
        </div>
      </Reveal>
    );
  }

  return (
    <div className="menu-category" id={category.id}>
      <Reveal effect="zoom" amount={0.5}>
        <DishTitle>{category.label}</DishTitle>
      </Reveal>
      <RevealGroup as="ul" className="menu-list">
        {category.items.map((item) => (
          <MenuItem key={item.name} item={item} />
        ))}
      </RevealGroup>
    </div>
  );
}
