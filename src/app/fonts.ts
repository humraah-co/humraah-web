import localFont from "next/font/local";

// Self-hosted brand fonts (SIL Open Font License). Weights match the Figma
// text styles: headings use Cormorant Garamond 600/700, body and UI use
// DM Sans (variable weight + optical size), script accents use Caveat, and
// Urdu uses Noto Nastaliq Urdu.

export const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/cormorant-garamond-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

export const dmSans = localFont({
  src: "./fonts/dm-sans-latin-opsz-normal.woff2",
  weight: "100 1000",
  variable: "--font-dm-sans",
  display: "swap",
});

export const caveat = localFont({
  src: "./fonts/caveat-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

export const nastaliq = localFont({
  src: [
    { path: "./fonts/noto-nastaliq-urdu-arabic-400-normal.woff2", weight: "400" },
    { path: "./fonts/noto-nastaliq-urdu-arabic-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-nastaliq",
  display: "swap",
  preload: false,
});
