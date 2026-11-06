import { formatPrice } from "../../data/menu";
import type { MenuItemData } from "../../data/menu";
import { RevealItem } from "../motion/Reveal";
import { useItemOffer } from "../../data/useContent";

export function MenuItem({ item }: { item: MenuItemData }) {
  const offer = useItemOffer(item.name);
  return (
    <RevealItem as="li" className={`menu-item${offer ? " menu-item--offer" : ""}`} effect="flipDown">
      {offer ? <span className="menu-item__badge">{offer.label}</span> : null}
      <div className="menu-item__line">
        <span className="menu-item__name">{item.name}</span>
        <span className="menu-item__leader" aria-hidden="true" />
        {offer ? (
          <span className="menu-item__price">
            <s className="menu-item__was" aria-label={`Regular price ${formatPrice(item.price)}`}>{formatPrice(item.price)}</s> {formatPrice(offer.offerPrice)}
          </span>
        ) : (
          <span className="menu-item__price">{formatPrice(item.price)}</span>
        )}
      </div>
      {item.note ? <span className="menu-item__note">{item.note}</span> : null}
    </RevealItem>
  );
}
