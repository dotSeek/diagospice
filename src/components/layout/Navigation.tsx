import { navLinks, restaurant } from "../../data/restaurant";
import { BadgeIcon } from "../ui/BadgeIcon";
import { Button } from "../ui/Button";
import { CloseIcon } from "../ui/CloseIcon";
import { useDialog } from "../ui/useDialog";

interface NavigationProps {
  open: boolean;
  onClose: () => void;
}

/** Paper card that slides over the page from the red menu circle. */
export function Navigation({ open, onClose }: NavigationProps) {
  const ref = useDialog(open);

  return (
    <dialog
      ref={ref}
      className="paper-dialog drawer"
      aria-label="Site menu"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="drawer__inner">
        <div className="drawer__top">
          <span>Menu</span>
          <button type="button" className="close-button" aria-label="Close menu" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <nav className="drawer__links" aria-label="Main">
          {navLinks.map((link) => (
            <a key={link.href} className="drawer__link" href={link.href} onClick={onClose}>
              <BadgeIcon className="drawer__icon" />
              {link.label}
            </a>
          ))}
        </nav>
        <Button variant="primary" href={restaurant.phoneHref}>
          Book a table
        </Button>
      </div>
    </dialog>
  );
}
