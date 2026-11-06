import type { CSSProperties, ReactNode } from "react";
import type { TargetAndTransition } from "motion/react";
import * as m from "motion/react-m";
import { EASE_OUT, REVEAL_DISTANCE, REVEAL_DURATION } from "./motion";

type Tag = "div" | "section" | "article" | "figure" | "header" | "footer" | "ul" | "li" | "p" | "span";

/**
 * Entrance effects, picked per section so each part of the page moves in its own way:
 *  rise       fade and lift (default)
 *  fade       opacity only
 *  zoom       fade and grow from 92%
 *  slideLeft  fade in from the left
 *  slideRight fade in from the right
 *  flipDown   3D flip down from the top edge, like a menu board turning (menu rows, panels)
 *  flipCard   3D turn on the vertical axis, like a playing card (deal cards, photos, info cards)
 */
export type RevealEffect = "rise" | "fade" | "zoom" | "slideLeft" | "slideRight" | "flipDown" | "flipCard";

const hidden: Record<RevealEffect, TargetAndTransition> = {
  rise: { opacity: 0, y: REVEAL_DISTANCE },
  fade: { opacity: 0 },
  zoom: { opacity: 0, scale: 0.92 },
  slideLeft: { opacity: 0, x: -48 },
  slideRight: { opacity: 0, x: 48 },
  flipDown: { opacity: 0, rotateX: -35, y: 10, transformPerspective: 900 },
  flipCard: { opacity: 0, rotateY: 35, transformPerspective: 1100 },
};

const shown: TargetAndTransition = { opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0 };

const origin: Partial<Record<RevealEffect, CSSProperties>> = {
  flipDown: { transformOrigin: "50% 0%" },
};

interface RevealProps {
  children?: ReactNode;
  as?: Tag;
  effect?: RevealEffect;
  className?: string;
  id?: string;
  /** Seconds to wait once in view, for staggered groups. */
  delay?: number;
  /** Fraction of the element that must be visible before it plays. */
  amount?: number;
  duration?: number;
  style?: CSSProperties;
}

/** Plays its entrance effect the first time it scrolls into view. */
export function Reveal({
  children,
  as = "div",
  effect = "rise",
  className,
  id,
  delay = 0,
  amount = 0.1,
  duration = REVEAL_DURATION,
  style,
}: RevealProps) {
  const Component = m[as];
  return (
    <Component
      className={className}
      id={id}
      style={{ ...origin[effect], ...style }}
      initial={hidden[effect]}
      whileInView={shown}
      viewport={{ once: true, amount }}
      transition={{ duration, ease: EASE_OUT, delay }}
    >
      {children}
    </Component>
  );
}

interface RevealGroupProps {
  children?: ReactNode;
  as?: Tag;
  className?: string;
  id?: string;
  /** Seconds between each child starting. */
  stagger?: number;
  style?: CSSProperties;
}

/**
 * Watches one untransformed container and plays its RevealItem children in sequence.
 * Used for long lists (menu rows, deal cards): the visibility check runs on the list itself,
 * never on a rotated row, so every row reliably appears on every browser, iOS Safari included.
 */
export function RevealGroup({ children, as = "div", className, id, stagger = 0.045, style }: RevealGroupProps) {
  const Component = m[as];
  return (
    <Component
      className={className}
      id={id}
      style={style}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0 }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Component>
  );
}

interface RevealItemProps {
  children?: ReactNode;
  as?: Tag;
  effect?: RevealEffect;
  className?: string;
  duration?: number;
}

/** A child of RevealGroup. It has no visibility check of its own; the group starts it. */
export function RevealItem({ children, as = "div", effect = "rise", className, duration = 0.55 }: RevealItemProps) {
  const Component = m[as];
  return (
    <Component
      className={className}
      style={origin[effect]}
      variants={{
        hidden: hidden[effect],
        shown: { ...shown, transition: { duration, ease: EASE_OUT } },
      }}
    >
      {children}
    </Component>
  );
}
