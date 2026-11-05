import { formatPrice } from "../../data/menu";
import type { MenuItemData } from "../../data/menu";

export function MenuItem({ item }: { item: MenuItemData }) {
  return (
    <li className="menu-item">
      <div className="menu-item__line">
        <span className="menu-item__name">{item.name}</span>
        <span className="menu-item__leader" aria-hidden="true" />
        <span className="menu-item__price">{formatPrice(item.price)}</span>
      </div>
      {item.note ? <span className="menu-item__note">{item.note}</span> : null}
    </li>
  );
}
