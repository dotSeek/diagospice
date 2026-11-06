import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { AboutSection } from "./components/sections/AboutSection";
import { ContactSection } from "./components/sections/ContactSection";
import { GallerySection } from "./components/sections/GallerySection";
import { HeroSection } from "./components/sections/HeroSection";
import { LocationSection } from "./components/sections/LocationSection";
import { MenuSection } from "./components/sections/MenuSection";
import { WhatsAppFloat } from "./components/ui/WhatsAppFloat";

export function App() {
  return (
    <>
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
    </>
  );
}
