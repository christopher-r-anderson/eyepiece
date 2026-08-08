import { defineGlobalFontface } from '@pandacss/dev'

// Files come from public/fonts: Spline Sans Mono is committed (OFL), Zodiak and
// Switzer are fetched at build time (see scripts/fetch-fonts.mjs).
//
// The "* Fallback" faces are local system fonts metric-matched to the webfonts
// (size-adjust/ascent/descent/line-gap computed with @capsizecss/unpack from
// the pinned files). Matching aligns font size and line boxes, so the swap
// does not shift vertical layout; per-glyph advances still differ, so long
// text can rewrap. Each fallback face lists only locals that are metrically
// compatible with the family the overrides were computed against (Liberation
// Sans tracks Arial, Gelasio and Liberation Mono track Georgia and Courier
// New). Recompute the values if the pinned fonts ever change.
export const globalFontface = defineGlobalFontface({
  // the preloaded first-paint faces are optional: the preload nearly always
  // wins the race, and a slow font then keeps the metric-matched fallback
  // instead of swapping in late and rewrapping; on-demand faces still swap
  Zodiak: {
    src: "url('/fonts/zodiak-400.woff2') format('woff2')",
    fontWeight: 400,
    fontStyle: 'normal',
    fontDisplay: 'optional',
  },
  Switzer: [
    {
      src: "url('/fonts/switzer-400.woff2') format('woff2')",
      fontWeight: 400,
      fontStyle: 'normal',
      fontDisplay: 'optional',
    },
    {
      src: "url('/fonts/switzer-400-italic.woff2') format('woff2')",
      fontWeight: 400,
      fontStyle: 'italic',
      fontDisplay: 'swap',
    },
    {
      src: "url('/fonts/switzer-500.woff2') format('woff2')",
      fontWeight: 500,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
    {
      src: "url('/fonts/switzer-600.woff2') format('woff2')",
      fontWeight: 600,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
    {
      src: "url('/fonts/switzer-700.woff2') format('woff2')",
      fontWeight: 700,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
  ],
  // variable font; one file covers the whole weight range
  'Spline Sans Mono': {
    src: "url('/fonts/spline-sans-mono.woff2') format('woff2')",
    fontWeight: '300 700',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
  'Zodiak Fallback': {
    src: "local('Georgia'), local('Gelasio')",
    sizeAdjust: '111.48%',
    ascentOverride: '88.8%',
    descentOverride: '23.32%',
    lineGapOverride: '8.07%',
  },
  'Switzer Fallback': {
    src: "local('Arial'), local('Liberation Sans')",
    sizeAdjust: '100.27%',
    ascentOverride: '97.74%',
    descentOverride: '24.93%',
    lineGapOverride: '8.98%',
  },
  'Spline Sans Mono Fallback': {
    src: "local('Courier New'), local('Liberation Mono')",
    sizeAdjust: '99.98%',
    ascentOverride: '96.37%',
    descentOverride: '23.65%',
    lineGapOverride: '0%',
  },
})
