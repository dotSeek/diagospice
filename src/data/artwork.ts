// Engraved style artwork drawn for Diago Spice. Plain SVG strings so the website
// and the PDF menus share the same drawings. Colour follows currentColor, and
// shapes that must hide lines behind them use --art-bg.

export type ArtName =
  | "telephone"
  | "burger"
  | "bowl"
  | "fries"
  | "cake"
  | "cloche"
  | "tankard"
  | "chilli"
  | "compass";

const BG = "var(--art-bg, #f9f8f2)";

const wrap = (uid: string, body: string): string =>
  `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>` +
  `<pattern id="fine-${uid}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 0v4" stroke="currentColor" stroke-width="1"/></pattern>` +
  `<pattern id="dark-${uid}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-42)"><path d="M0 0v3" stroke="currentColor" stroke-width="1.700"/></pattern>` +
  `</defs><g fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;

const shadow = (uid: string, cx: number, cy: number, rx: number, ry: number): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#fine-${uid})" stroke="none"/>`;

const drawings: Record<ArtName, (uid: string) => string> = {
  telephone: (uid) => `
    ${shadow(uid, 124, 182, 100, 9)}
    <path d="M28 176c-6 0-10-4-10-9v-4c0-5 4-9 10-9h178c6 0 10 4 10 9v4c0 5-4 9-10 9z" fill="${BG}"/>
    <path d="M120 176h96v-9c0-3-1-6-3-8l-93-1z" fill="url(#dark-${uid})" stroke="none"/>
    <path d="M44 154c5-46 21-76 50-92h52c29 16 45 46 50 92z" fill="${BG}"/>
    <path d="M128 62h18c29 16 45 46 50 92h-52c-2-32-8-66-16-92z" fill="url(#fine-${uid})" stroke="none"/>
    <path d="M160 74c17 16 26 44 29 78h-14c-3-32-9-60-15-78z" fill="url(#dark-${uid})" stroke="none"/>
    <circle cx="120" cy="112" r="31" fill="${BG}"/>
    <circle cx="120" cy="112" r="24"/>
    <circle cx="120" cy="112" r="10" fill="url(#fine-${uid})"/>
    <g fill="currentColor" stroke="none">
      <circle cx="120" cy="94" r="3.600"/><circle cx="133" cy="99" r="3.600"/><circle cx="138" cy="112" r="3.600"/>
      <circle cx="133" cy="125" r="3.600"/><circle cx="120" cy="130" r="3.600"/><circle cx="107" cy="125" r="3.600"/>
      <circle cx="102" cy="112" r="3.600"/><circle cx="107" cy="99" r="3.600"/>
    </g>
    <path d="M96 62V46M144 62V46M90 46h60"/>
    <path d="M60 22c-22 2-36 12-36 26 0 8 5 13 13 13h20c8 0 12-5 12-11v-8h102v8c0 6 4 11 12 11h20c8 0 13-5 13-13 0-14-14-24-36-26-26-5-94-5-120 0z" fill="${BG}"/>
    <path d="M126 19c19 0 41 1 54 3 22 2 36 12 36 26 0 8-5 13-13 13h-20c-8 0-12-5-12-11v-8h-45z" fill="url(#fine-${uid})" stroke="none"/>
    <path d="M186 30c14 3 22 10 22 19 0 4-2 6-6 6h-14c-3 0-5-2-5-5z" fill="url(#dark-${uid})" stroke="none"/>
    <path d="M44 96c-24 10-34 28-30 50 3 16 2 24-8 30" />
    <path d="M40 104c-14 8-20 20-18 36"/>`,

  burger: (uid) => `
    ${shadow(uid, 120, 184, 96, 9)}
    <path d="M34 92c0-40 38-68 86-68s86 28 86 68c0 5-3 8-8 8H42c-5 0-8-3-8-8z" fill="${BG}"/>
    <path d="M120 24c48 0 86 28 86 68 0 5-3 8-8 8h-34c6-28-8-60-44-76z" fill="url(#fine-${uid})" stroke="none"/>
    <path d="M170 44c20 12 30 28 30 46 0 2-1 4-3 4h-16c2-18-2-36-11-50z" fill="url(#dark-${uid})" stroke="none"/>
    <g fill="${BG}"><ellipse cx="86" cy="52" rx="6" ry="3.500" transform="rotate(-24 86 52)"/><ellipse cx="116" cy="40" rx="6" ry="3.500"/><ellipse cx="148" cy="52" rx="6" ry="3.500" transform="rotate(24 148 52)"/><ellipse cx="68" cy="74" rx="6" ry="3.500" transform="rotate(-30 68 74)"/><ellipse cx="102" cy="68" rx="6" ry="3.500"/><ellipse cx="134" cy="72" rx="6" ry="3.500"/><ellipse cx="170" cy="74" rx="6" ry="3.500" transform="rotate(30 170 74)"/></g>
    <path d="M26 112c10-10 18 6 28-2s16 8 28 0 18 6 28-1 18 8 28 1 18 6 28-1 16 8 26 1 12 2 22 3l-2 8H28z" fill="${BG}"/>
    <path d="M30 122h180c5 0 8 3 8 7v3c0 5-3 8-8 8H30c-5 0-8-3-8-8v-3c0-4 3-7 8-7z" fill="url(#dark-${uid})"/>
    <path d="M40 124h160l-26 16-20-12-30 22-22-22-30 14z" fill="${BG}"/>
    <path d="M36 146h168c4 0 7 3 7 7 0 18-12 26-28 26H57c-16 0-28-8-28-26 0-4 3-7 7-7z" fill="${BG}"/>
    <path d="M124 146h80c4 0 7 3 7 7 0 18-12 26-28 26h-59z" fill="url(#fine-${uid})" stroke="none"/>`,

  bowl: (uid) => `
    ${shadow(uid, 120, 184, 84, 8)}
    <path d="M86 26c-8 8 8 14 0 24M120 16c-8 10 8 16 0 28M154 26c-8 8 8 14 0 24" stroke-width="2"/>
    <path d="M36 88c0 50 34 88 84 88s84-38 84-88z" fill="${BG}"/>
    <path d="M124 88h80c0 50-34 88-84 88 26-14 40-48 4-88z" fill="url(#fine-${uid})" stroke="none"/>
    <path d="M170 92h28c-2 34-22 64-54 76 20-18 30-46 26-76z" fill="url(#dark-${uid})" stroke="none"/>
    <path d="M36 96c-14-4-22 0-22 8s10 12 24 8M204 96c14-4 22 0 22 8s-10 12-24 8"/>
    <ellipse cx="120" cy="84" rx="92" ry="24" fill="${BG}"/>
    <ellipse cx="120" cy="84" rx="78" ry="17" fill="url(#fine-${uid})"/>
    <g fill="${BG}">
      <path d="M86 78c8-6 20-4 26 2-8 6-20 6-26-2z"/><path d="M128 76c8-5 18-3 24 3-8 5-18 5-24-3z"/><path d="M104 90c8-5 18-3 24 3-8 5-18 4-24-3z"/>
    </g>
    <path d="M58 118c6 12 14 24 26 32M72 112c4 10 10 18 18 26" stroke-width="1.600"/>`,

  fries: (uid) => `
    ${shadow(uid, 122, 186, 70, 8)}
    <g fill="${BG}">
      <path d="M62 96 52 34l12-3 11 66z"/><path d="M82 92 76 18l13-1 5 76z"/><path d="M104 92 104 28l13 0 1 64z"/>
      <path d="M126 92 132 12l13 1-6 80z"/><path d="M146 94 158 26l12 3-11 66z"/><path d="M162 98 182 44l11 4-20 52z"/>
      <path d="M70 92 60 58l11-3 11 37z"/><path d="M116 92 122 48l12 2-6 42z"/>
    </g>
    <path d="M132 12l13 1-6 80h-7zM158 26l12 3-11 66-7-2z" fill="url(#fine-${uid})" stroke="none"/>
    <path d="M52 84c44 22 92 22 136 0l-18 96H70z" fill="${BG}"/>
    <path d="M128 98c22-1 42-6 60-14l-18 96h-44c8-26 8-56 2-82z" fill="url(#fine-${uid})" stroke="none"/>
    <path d="M166 92l18-8-16 96h-14c8-28 12-58 12-88z" fill="url(#dark-${uid})" stroke="none"/>
    <path d="M60 124c38 14 82 14 120 0M66 152c34 10 74 10 108 0" stroke-width="1.600"/>`,

  cake: (uid) => `
    ${shadow(uid, 124, 182, 100, 9)}
    <path d="M16 172c32 10 176 10 208 0l-6 8c-34 8-162 8-196 0z" fill="${BG}"/>
    <path d="M44 86l112-44c26 8 44 24 44 44v82H44z" fill="${BG}"/>
    <path d="M44 86h156v22H44z" fill="url(#dark-${uid})"/>
    <path d="M44 132h156v14H44z" fill="url(#dark-${uid})"/>
    <path d="M132 86h68v82h-60c6-26 2-56-8-82z" fill="url(#fine-${uid})" stroke="none"/>
    <path d="M44 86l112-44c26 8 44 24 44 44z" fill="${BG}"/>
    <path d="M60 86c16 10 22-4 36 4s18-6 32 2 22-6 34 0 20-4 38-6" stroke-width="2"/>
    <circle cx="150" cy="40" r="14" fill="${BG}"/>
    <path d="M150 26c8 0 14 6 14 14s-6 14-14 14c6-8 6-20 0-28z" fill="url(#dark-${uid})" stroke="none"/>
    <path d="M150 26c2-10 8-16 18-20" />`,

  cloche: (uid) => `
    ${shadow(uid, 120, 186, 104, 8)}
    <path d="M14 166h212c4 0 6 2 6 5s-2 5-6 5H14c-4 0-6-2-6-5s2-5 6-5z" fill="${BG}"/>
    <path d="M30 166c0-58 40-104 90-104s90 46 90 104z" fill="${BG}"/>
    <path d="M124 62c48 2 86 48 86 104h-48c2-42-12-82-38-104z" fill="url(#fine-${uid})" stroke="none"/>
    <path d="M172 92c18 18 30 44 32 72h-22c0-28-4-52-10-72z" fill="url(#dark-${uid})" stroke="none"/>
    <path d="M54 136c4-22 16-40 34-52" stroke-width="2"/>
    <path d="M110 62v-8c0-4 4-6 10-6s10 2 10 6v8" fill="${BG}"/>
    <circle cx="120" cy="36" r="13" fill="${BG}"/>
    <path d="M120 23c7 0 13 6 13 13s-6 13-13 13c5-8 5-18 0-26z" fill="url(#dark-${uid})" stroke="none"/>`,

  tankard: (uid) => `
    ${shadow(uid, 118, 186, 76, 8)}
    <path d="M166 74h20c18 0 28 12 28 34s-10 34-28 34h-20v-16h16c10 0 14-6 14-18s-4-18-14-18h-16z" fill="${BG}"/>
    <path d="M48 62h120v116c0 2-2 4-4 4H52c-2 0-4-2-4-4z" fill="${BG}"/>
    <path d="M116 62h52v116c0 2-2 4-4 4h-48c6-40 6-80 0-120z" fill="url(#fine-${uid})" stroke="none"/>
    <path d="M144 62h24v116c0 2-2 4-4 4h-20z" fill="url(#dark-${uid})" stroke="none"/>
    <path d="M48 84h120M48 160h120" stroke-width="3"/>
    <path d="M72 98v48M92 98v48" stroke-width="1.600"/>
    <path d="M42 62c-10-4-12-20 2-24 2-14 22-20 32-10 8-12 32-12 40 0 10-8 30-4 32 8 16 0 24 18 12 26-4 12-16 12-22 4-6 10-18 8-22 0-8 8-22 6-26-2-6 8-20 8-26 0z" fill="${BG}"/>
    <circle cx="82" cy="46" r="4"/><circle cx="118" cy="40" r="3"/><circle cx="142" cy="50" r="4"/>`,

  chilli: (uid) => `
    ${shadow(uid, 126, 176, 80, 7)}
    <path d="M176 30c6-12 16-16 26-14-6 8-12 14-14 24" fill="${BG}"/>
    <path d="M160 36c14-4 30 2 34 14 4 14-8 20-12 34-12 44-58 80-142 86-8 0-10-6-4-10 56-16 88-54 104-92 4-12 8-28 20-32z" fill="${BG}"/>
    <path d="M186 68c-14 46-60 88-142 100-6 0-8-2-8-4 80-8 118-50 134-96 4-10 10-14 16 0z" fill="url(#fine-${uid})" stroke="none"/>
    <path d="M186 70c-8 26-24 50-50 68 16-22 26-44 32-66 4-8 14-12 18-2z" fill="url(#dark-${uid})" stroke="none"/>
    <path d="M150 62c-14 36-40 66-82 88" stroke-width="1.600"/>`,

  compass: (uid) => `
    ${shadow(uid, 120, 188, 66, 6)}
    <circle cx="120" cy="100" r="82" fill="${BG}"/>
    <circle cx="120" cy="100" r="70"/>
    <path d="M186 74a70 70 0 0 1-8 66l-10-6a58 58 0 0 0 6-54z" fill="url(#fine-${uid})" stroke="none"/>
    <g stroke-width="2"><path d="M120 18v12M120 170v12M38 100h12M190 100h12M62 42l8 8M178 42l-8 8M62 158l8-8M178 158l-8-8"/></g>
    <path d="M120 40l14 46 46 14-46 14-14 46-14-46-46-14 46-14z" fill="${BG}"/>
    <path d="M120 40l14 46-14 14zM180 100l-46 14-14-14zM120 160l-14-46 14-14zM60 100l46-14 14 14z" fill="url(#dark-${uid})"/>
    <circle cx="120" cy="100" r="5" fill="${BG}"/>`,
};

export const artworkSvg = (name: ArtName, uid: string): string => wrap(uid, drawings[name](uid));
