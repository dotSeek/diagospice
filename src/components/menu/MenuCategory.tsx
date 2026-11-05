import type { ArtName } from "../../data/artwork";
import type { MenuCategoryData } from "../../data/menu";
import { Artwork } from "../ui/Artwork";
import { DishTitle } from "../ui/SectionHeading";
import { MenuItem } from "./MenuItem";
import { MenuItemCard } from "./MenuItemCard";

interface MenuCategoryProps {
  category: MenuCategoryData;
  art?: ArtName;
}

export function MenuCategory({ category, art }: MenuCategoryProps) {
  if (category.kind === "deals") {
    return (
      <div className="stroke-card" id={category.id}>
        <div className="stroke-card__inner">
          <DishTitle>{category.label}</DishTitle>
          <div className="title-rule" aria-hidden="true">
            <span className="diamond" />
          </div>
          {category.deals.map((deal) => (
            <MenuItemCard key={deal.name} deal={deal} />
          ))}
          {art ? <Artwork name={art} className="menu-art" /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="menu-category" id={category.id}>
      <DishTitle>{category.label}</DishTitle>
      <ul className="menu-list">
        {category.items.map((item) => (
          <MenuItem key={item.name} item={item} />
        ))}
      </ul>
    </div>
  );
}
