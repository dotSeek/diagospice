import { formatPrice } from "../../data/menu";
import type { DealData } from "../../data/menu";

export function MenuItemCard({ deal }: { deal: DealData }) {
  return (
    <article className="deal">
      <h4 className="deal__name">{deal.name}</h4>
      <p className="deal__includes">{deal.includes.join(", ")}</p>
      <p className="deal__price">{formatPrice(deal.price)}</p>
    </article>
  );
}
