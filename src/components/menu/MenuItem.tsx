import { formatPrice } from "../../data/menu";
import type { MenuItemData } from "../../data/menu";
import { Reveal } from "../motion/Reveal";

export function MenuItem({ item, index = 0 }: { item: MenuItemData; index?: number }) {
  return (
    <Reveal as="li" className="menu-item" effect="flipDown" delay={Math.min(index, 8) * 0.045} duration={0.55} amount={0.6}>
      <div className="menu-item__line">
        <span className="menu-item__name">{item.name}</span>
        <span className="menu-item__leader" aria-hidden="true" />
        <span className="menu-item__price">{formatPrice(item.price)}</span>
      </div>
      {item.note ? <span className="menu-item__note">{item.note}</span> : null}
    </Reveal>
  );
}
