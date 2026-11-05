import { restaurant } from "../../data/restaurant";
import { Button } from "../ui/Button";

interface MenuDownloadButtonProps {
  href?: string;
  filename?: string;
  label?: string;
}

export function MenuDownloadButton({
  href = restaurant.menuPdfUrl,
  filename = restaurant.menuPdfFilename,
  label = "Download menu",
}: MenuDownloadButtonProps) {
  return (
    <Button href={href} download={filename} aria-label={`${label} as a PDF`}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.500" aria-hidden="true">
        <path d="M8 1v10M4 7l4 4 4-4M2 14h12" />
      </svg>
      {label}
    </Button>
  );
}
