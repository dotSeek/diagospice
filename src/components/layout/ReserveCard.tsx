import { buffet } from "../../data/menu";
import { restaurant } from "../../data/restaurant";
import { Artwork } from "../ui/Artwork";
import { Button } from "../ui/Button";
import { CloseIcon } from "../ui/CloseIcon";
import { PhoneIcon } from "../ui/PhoneIcon";
import { SocialLinks } from "../ui/SocialLinks";
import { useDialog } from "../ui/useDialog";

interface ReserveCardProps {
  open: boolean;
  onClose: () => void;
}

export function ReserveCard({ open, onClose }: ReserveCardProps) {
  const ref = useDialog(open);

  return (
    <dialog
      ref={ref}
      className="paper-dialog reserve-card"
      aria-labelledby="reserve-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="reserve-card__layout">
        <div className="reserve-card__art">
          <Artwork name="telephone" />
          <p>Tables and buffet bookings by phone</p>
        </div>
        <div className="reserve-card__body">
          <button type="button" className="close-button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
          <p className="reserve-card__kicker">Book now</p>
          <h2 className="reserve-card__title" id="reserve-title">
            Reserve your table
          </h2>
          <a className="reserve-card__phone" href={restaurant.phoneHref}>
            {restaurant.phoneDisplay}
          </a>
          <div className="reserve-card__actions">
            <Button variant="primary" href={restaurant.phoneHref}>
              <PhoneIcon className="reserve-card__call-icon" />
              Call now
            </Button>
            <Button href={restaurant.directionsUrl} target="_blank" rel="noopener noreferrer">
              Directions
            </Button>
          </div>
          <dl className="reserve-card__facts">
            <div>
              <dt>Address</dt>
              <dd>{restaurant.addressInline}</dd>
            </div>
            <div>
              <dt>Buffet</dt>
              <dd>
                {buffet.days}, {buffet.hours}
              </dd>
            </div>
          </dl>
          <SocialLinks className="reserve-card__social" />
        </div>
      </div>
    </dialog>
  );
}
