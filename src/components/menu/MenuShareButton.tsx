import { useEffect, useRef, useState } from "react";

interface MenuShareButtonProps {
  url: string;
  title: string;
  label: string;
}

/** Shares the menu page rather than the PDF itself, because only the page carries a social preview. */
export function MenuShareButton({ url, title, label }: MenuShareButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2500);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // The visitor closed the share sheet, so there is nothing to report.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      flash("Link copied");
    } catch {
      flash("Could not copy link");
    }
  };

  return (
    <button type="button" className="button button--outline" onClick={share}>
      <span className="button__inner" aria-live="polite">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.500" aria-hidden="true">
          <circle cx="12.500" cy="3" r="2" />
          <circle cx="12.500" cy="13" r="2" />
          <circle cx="3.500" cy="8" r="2" />
          <path d="M5.300 7l5.400-3M5.300 9l5.400 3" />
        </svg>
        {message ?? label}
      </span>
    </button>
  );
}
