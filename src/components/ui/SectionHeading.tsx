import type { ReactNode } from "react";

/** Italic section title held between two diamonds. */
export function DishTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3 className="dish-title" id={id}>
      <span className="diamond" aria-hidden="true" />
      <span>{children}</span>
      <span className="diamond" aria-hidden="true" />
    </h3>
  );
}

/** Solid red block with a small kicker over a large title. */
export function RedBlock({ kicker, title, id }: { kicker: string; title: string; id?: string }) {
  return (
    <div className="red-block">
      <p className="red-block__top">{kicker}</p>
      <h2 className="red-block__title" id={id}>
        {title}
      </h2>
    </div>
  );
}
