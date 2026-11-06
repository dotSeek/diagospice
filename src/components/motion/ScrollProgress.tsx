import { useScroll, useSpring } from "motion/react";
import * as m from "motion/react-m";

/** Thin gold bar along the top edge that fills as the page is scrolled. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.3 });
  return <m.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}
