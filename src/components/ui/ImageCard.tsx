interface ImageCardProps {
  src: string;
  alt: string;
  caption: string;
  onOpen: () => void;
}

export function ImageCard({ src, alt, caption, onOpen }: ImageCardProps) {
  return (
    <button type="button" className="image-card" onClick={onOpen} aria-label={`View larger: ${caption}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      <span className="image-card__caption">{caption}</span>
    </button>
  );
}
