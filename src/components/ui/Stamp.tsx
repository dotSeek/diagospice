/** Inked postmark drawn for Diago Spice. Decorative only. */
export function Stamp({ top, middle, bottom }: { top: string; middle: string; bottom: string }) {
  return (
    <svg className="stamp" viewBox="0 0 200 200" fill="none" aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="3" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="58" stroke="currentColor" strokeWidth="1.500" />
      <defs>
        <path id="stamp-top" d="M100 100m-68 0a68 68 0 1 1 136 0" />
        <path id="stamp-bottom" d="M100 100m-80 0a80 80 0 0 0 160 0" />
      </defs>
      <g fill="currentColor" fontFamily="Georgia, serif" fontWeight="700" letterSpacing="2.500">
        <text fontSize="17" textAnchor="middle">
          <textPath href="#stamp-top" startOffset="50%">
            {top}
          </textPath>
        </text>
        <text fontSize="15" textAnchor="middle">
          <textPath href="#stamp-bottom" startOffset="50%">
            {bottom}
          </textPath>
        </text>
        <text x="100" y="105" fontSize="15" textAnchor="middle" letterSpacing="0">
          {middle}
        </text>
      </g>
    </svg>
  );
}
