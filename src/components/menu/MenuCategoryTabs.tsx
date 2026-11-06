import { buffet, menuCategories } from "../../data/menu";
import type { MenuCategoryData } from "../../data/menu";

/** Category navigation: the whole menu sits on one page, so these jump to each part. It follows the
 *  published menu once it has loaded, so a hidden section never leaves a dead link. */
export function MenuCategoryTabs({ categories = menuCategories }: { categories?: MenuCategoryData[] }) {
  const links = [...categories.map(({ id, label }) => ({ id, label })), { id: buffet.id, label: buffet.label }];
  return (
    <nav className="menu-jump" aria-label="Menu categories">
      {links.map((link) => (
        <a key={link.id} href={`#${link.id}`}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
