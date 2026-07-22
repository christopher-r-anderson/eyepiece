import { defineGlobalFontface } from '@pandacss/dev'

// Files come from public/fonts: Spline Sans Mono is committed (OFL), Zodiak and
// Switzer are fetched at build time (see scripts/fetch-fonts.mjs).
//
// The "* Fallback" faces are local system fonts metric-matched to the webfonts
// (size-adjust/ascent/descent/line-gap computed with @capsizecss/unpack from
// the pinned files). This aligns line heights and vertical metrics so the swap
// minimises layout shift; glyph advance widths may still differ, so text can
// rewrap. Recompute if the pinned fonts ever change.
export const globalFontface = defineGlobalFontface({
  Zodiak: {
    src: "url('/fonts/zodiak-400.woff2') format('woff2')",
    fontWeight: 400,
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
  Switzer: [
    {
      src: "url('/fonts/switzer-400.woff2') format('woff2')",
      fontWeight: 400,
      fontStyle: 'normal',
      fontDisplay: 'swap',
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
  ],
  'Spline Sans Mono': [
    {
      src: "url('/fonts/spline-sans-mono-400.woff2') format('woff2')",
      fontWeight: 400,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
    {
      src: "url('/fonts/spline-sans-mono-500.woff2') format('woff2')",
      fontWeight: 500,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
  ],
  'Zodiak Fallback': {
    src: "local('Georgia')",
    sizeAdjust: '111.48%',
    ascentOverride: '88.8%',
    descentOverride: '23.32%',
    lineGapOverride: '8.07%',
  },
  'Switzer Fallback': {
    src: "local('Arial'), local('Liberation Sans'), local('Helvetica Neue')",
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
