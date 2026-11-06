import type { AnchorHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: "outline" | "primary" | "light" | "gold";
  children: ReactNode;
}

/** Double stroke button. Every call to action moves somewhere, so it renders as a link. */
export function Button({ variant = "outline", className = "", children, ...rest }: ButtonProps) {
  return (
    <a className={`button button--${variant} ${className}`.trim()} {...rest}>
      <span className="button__inner">{children}</span>
    </a>
  );
}
