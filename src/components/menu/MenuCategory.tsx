import type { ArtName } from "../../data/artwork";
import type { MenuCategoryData } from "../../data/menu";
import { Artwork } from "../ui/Artwork";
import { DishTitle } from "../ui/SectionHeading";
import { MenuItem } from "./MenuItem";
import { MenuItemCard } from "./MenuItemCard";
import { Reveal } from "../motion/Reveal";

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
          {category.deals.map((deal, index) => (
            <MenuItemCard key={deal.name} deal={deal} index={index} />
          ))}
          {art ? <Artwork name={art} className="menu-art" /> : null}
        </div>
      </Reveal>
    );
  }

  return (
    <div className="menu-category" id={category.id}>
      <Reveal effect="zoom" amount={0.8}>
        <DishTitle>{category.label}</DishTitle>
      </Reveal>
      <ul className="menu-list">
        {category.items.map((item, index) => (
          <MenuItem key={item.name} item={item} index={index} />
        ))}
      </ul>
    </div>
  );
}
