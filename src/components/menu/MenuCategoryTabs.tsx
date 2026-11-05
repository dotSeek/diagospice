import { buffet, menuCategories } from "../../data/menu";

const links = [...menuCategories.map(({ id, label }) => ({ id, label })), { id: buffet.id, label: buffet.label }, { id: "bar-menu", label: "Bar menu" }];

/** Category navigation: the whole menu sits on one page, so these jump to each part. */
export function MenuCategoryTabs() {
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
