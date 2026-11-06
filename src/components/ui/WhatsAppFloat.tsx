import { restaurant } from "../../data/restaurant";
import { WHATSAPP_PATH } from "./SocialLinks";

/** Floating order button, always in reach. Opens the WhatsApp chat with the pre filled order message. */
export function WhatsAppFloat() {
  return (
    <a className="wa-float" href={restaurant.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Order via WhatsApp">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d={WHATSAPP_PATH} />
      </svg>
      <span className="wa-float__label">Order via WhatsApp</span>
    </a>
  );
}
