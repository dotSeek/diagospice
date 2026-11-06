import { formatPrice } from "../../data/menu";
import type { DealData } from "../../data/menu";
import { Reveal } from "../motion/Reveal";

export function MenuItemCard({ deal, index = 0 }: { deal: DealData; index?: number }) {
  return (
    <Reveal as="article" className="deal" effect="flipCard" delay={index * 0.12} amount={0.4}>
      <h4 className="deal__name">{deal.name}</h4>
      <p className="deal__includes">{deal.includes.join(", ")}</p>
      <p className="deal__price">{formatPrice(deal.price)}</p>
    </Reveal>
  );
}
