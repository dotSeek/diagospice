import { useId } from "react";
import { artworkSvg } from "../../data/artwork";
import type { ArtName } from "../../data/artwork";

/** Renders one of our own engraved drawings. The markup is static, from artwork.ts. */
export function Artwork({ name, className = "" }: { name: ArtName; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <div
      className={`artwork ${className}`.trim()}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: artworkSvg(name, uid) }}
    />
  );
}
