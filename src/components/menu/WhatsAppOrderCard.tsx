import { delivery } from "../../data/menu";
import { restaurant } from "../../data/restaurant";
import { WHATSAPP_PATH } from "../ui/SocialLinks";
import { Reveal } from "../motion/Reveal";

/** Scan or tap to order. The QR code is generated from restaurant.whatsappUrl by the menu build. */
export function WhatsAppOrderCard() {
  return (
    <Reveal className="wa-card" effect="flipDown" amount={0.15}>
      <a className="wa-card__qr" href={restaurant.whatsappUrl} target="_blank" rel="noopener noreferrer">
        <span className="wa-card__scan">Scan to order</span>
        <img src="/brand/whatsapp-qr.svg" alt="QR code that opens a WhatsApp order chat with Diago Spice" width={160} height={160} loading="lazy" />
      </a>
      <div className="wa-card__body">
        <p className="script">Order your favourites!</p>
        <p className="wa-card__lead">Scan the QR code, or tap the button, to order directly through WhatsApp.</p>
        <a className="wa-card__button" href={restaurant.whatsappUrl} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d={WHATSAPP_PATH} />
          </svg>
          Order via WhatsApp
        </a>
        <p className="wa-card__manual">
          Prefer to order manually? Order directly on WhatsApp:{" "}
          <a className="link-red" href={restaurant.whatsappUrl} target="_blank" rel="noopener noreferrer">
            {restaurant.phoneDisplay}
          </a>
        </p>
        <ul className="wa-card__terms">
          <li>Minimum order {delivery.minimumOrder} (depending on delivery location)</li>
          <li>Free delivery within 3 miles</li>
          <li>£2 additional delivery charge for locations beyond 3 miles</li>
        </ul>
      </div>
    </Reveal>
  );
}
