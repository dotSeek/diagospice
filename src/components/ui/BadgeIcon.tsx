/** Red rounded square with a white four point star. Decorative only. */
export function BadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 50 50" aria-hidden="true" focusable="false">
      <rect width="50" height="50" rx="5" fill="var(--color-red)" />
      <path
        d="M25 10c1.800 8.800 6.200 13.200 15 15-8.800 1.800-13.200 6.200-15 15-1.800-8.800-6.200-13.200-15-15 8.800-1.800 13.200-6.200 15-15z"
        fill="var(--color-paper)"
      />
    </svg>
  );
}
