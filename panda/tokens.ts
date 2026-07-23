import { defineTokens } from '@pandacss/dev'

export const tokens = defineTokens({
  fonts: {
    display: {
      value: "'Zodiak', 'Zodiak Fallback', Georgia, serif",
    },
    sans: {
      value:
        "'Switzer', 'Switzer Fallback', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    },
    mono: {
      value:
        "'Spline Sans Mono', 'Spline Sans Mono Fallback', 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace",
    },
  },
  fontSizes: {
    xs: { value: '0.75rem' },
    sm: { value: 'clamp(0.8125rem, 0.8rem + 0.1vw, 0.875rem)' },
    base: { value: 'clamp(0.9375rem, 0.9rem + 0.25vw, 1rem)' },
    lg: { value: 'clamp(1rem, 0.95rem + 0.35vw, 1.125rem)' },
    xl: { value: 'clamp(1.25rem, 1.05rem + 1.1vw, 1.5rem)' },
    '2xl': { value: 'clamp(1.5rem, 1.15rem + 1.9vw, 2rem)' },
  },
  lineHeights: {
    tight: { value: '1.15' },
    base: { value: '1.5' },
  },
  sizes: {
    contentMax: { value: '72rem' },
    readingMax: { value: '65ch' },
    formMax: { value: '32rem' },
    pageColMax: { value: '40rem' },
    touchTargetMin: { value: '44px' },
    controlHeight: { value: 'clamp(2.25rem, 2.1rem + 0.5vw, 2.75rem)' },
    controlHeightSm: { value: 'calc({sizes.controlHeight} - {spacing.1})' },
  },
  spacing: {
    '1': { value: '0.25rem' },
    '2': { value: '0.5rem' },
    '3': { value: '0.75rem' },
    '4': { value: '1rem' },
    '5': { value: '1.5rem' },
    '6': { value: '2rem' },
    '7': { value: '3rem' },
    '8': { value: '4rem' },
    contentInline: { value: 'clamp(0.75rem, 2.5vw, 1.5rem)' },
    contentBlock: { value: 'clamp(1rem, 4vw, 2rem)' },
    clusterGap: { value: 'clamp(0.5rem, 1.8vw, 1rem)' },
    sectionGap: { value: 'clamp(1rem, 3vw, 2rem)' },
  },
  radii: {
    sm: { value: '0.25rem' },
    md: { value: '0.5rem' },
    lg: { value: '0.75rem' },
    full: { value: '9999px' },
  },
  borders: {
    default: { value: '1px solid {colors.border}' },
    control: { value: '1px solid {colors.control.border}' },
    separator: { value: '1px solid {colors.separator}' },
    // the app's single focus ring, applied as outline: 'focusRing'
    focusRing: { value: '2px solid {colors.star}' },
  },
  shadows: {
    sm: { value: '0 1px 2px rgba(0, 0, 0, 0.08)' },
    md: { value: '0 2px 8px rgba(0, 0, 0, 0.14)' },
    overlay: { value: '0 12px 28px rgba(0, 0, 0, 0.25)' },
    // contrasting layer under the focus ring when it draws over imagery
    focusHalo: { value: 'inset 0 0 0 4px {colors.bg.canvas}' },
  },
  zIndex: {
    base: { value: 0 },
    popover: { value: 10 },
    toast: { value: 20 },
    overlay: { value: 30 },
  },
  durations: {
    fast: { value: '120ms' },
    base: { value: '220ms' },
  },
  easings: {
    default: { value: 'ease' },
  },
})
