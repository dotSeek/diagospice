import { useCallback, useState } from "react";
import { galleryImages } from "../../data/images";
import { ImageCard } from "../ui/ImageCard";
import { useDialog } from "../ui/useDialog";

export function GallerySection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useDialog(activeIndex !== null);
  const active = activeIndex === null ? null : galleryImages[activeIndex];

  const step = useCallback((delta: number) => {
    setActiveIndex((index) =>
      index === null ? null : (index + delta + galleryImages.length) % galleryImages.length,
    );
  }, []);

  return (
    <section id="gallery" className="section-block" aria-labelledby="gallery-title">
      <div className="section-head">
        <h2 className="display" id="gallery-title">
          Gallery
        </h2>
      </div>
      <div className="gallery">
        {galleryImages.map((image, index) => (
          <div key={image.id} className={image.span ? `gallery__item--${image.span}` : undefined}>
            <ImageCard
              src={image.thumb}
              alt={image.alt}
              caption={image.caption}
              onOpen={() => setActiveIndex(index)}
            />
          </div>
        ))}
      </div>
      <p className="gallery__note">Illustrative photography.</p>
      <dialog
        ref={dialogRef}
        className="paper-dialog lightbox"
        aria-label="Image viewer"
        onClose={() => setActiveIndex(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setActiveIndex(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
      >
        {active ? (
          <>
            <img src={active.full} alt={active.alt} />
            <div className="lightbox__bar">
              <p className="lightbox__caption" aria-live="polite">
                {active.caption}
              </p>
              <div className="lightbox__controls">
                <button type="button" className="lightbox__button" onClick={() => step(-1)}>
                  Previous
                </button>
                <button type="button" className="lightbox__button" onClick={() => step(1)}>
                  Next
                </button>
                <button type="button" className="lightbox__button" onClick={() => setActiveIndex(null)}>
                  Close
                </button>
              </div>
            </div>
          </>
        ) : null}
      </dialog>
    </section>
  );
}
