import { formatPrice } from "../../data/menu";
import type { DealData } from "../../data/menu";
import { RevealItem } from "../motion/Reveal";

export function MenuItemCard({ deal }: { deal: DealData }) {
  return (
    <RevealItem as="article" className="deal" effect="flipCard" duration={0.6}>
      <h4 className="deal__name">{deal.name}</h4>
      <p className="deal__includes">{deal.includes.join(", ")}</p>
      <p className="deal__price">{formatPrice(deal.price)}</p>
    </RevealItem>
  );
}
