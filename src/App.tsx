import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { AboutSection } from "./components/sections/AboutSection";
import { ContactSection } from "./components/sections/ContactSection";
import { GallerySection } from "./components/sections/GallerySection";
import { HeroSection } from "./components/sections/HeroSection";
import { LocationSection } from "./components/sections/LocationSection";
import { MenuSection } from "./components/sections/MenuSection";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { ScrollProgress } from "./components/motion/ScrollProgress";
import { WhatsAppFloat } from "./components/ui/WhatsAppFloat";

export function App() {
  return (
    // reducedMotion="user": visitors who ask their device for less motion get no movement.
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
      <ScrollProgress />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="sheet">
        <div className="frame">
          <Header />
          <div className="frame__inner">
            <main id="main">
              <HeroSection />
              <AboutSection />
              <MenuSection />
              <GallerySection />
              <div className="visit section-block">
                <LocationSection />
                <div className="visit__line" aria-hidden="true" />
                <ContactSection />
              </div>
            </main>
            <Footer />
          </div>
        </div>
        <div className="sheet__end" />
      </div>
      <WhatsAppFloat />
      </LazyMotion>
    </MotionConfig>
  );
}
