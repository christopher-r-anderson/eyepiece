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
  // static UI sizes - only the display text styles are fluid
  fontSizes: {
    xs: { value: '0.75rem' },
    sm: { value: '0.8125rem' },
    // the utility voice (mono captions, metadata, conditions lines)
    mono: { value: '0.78125rem' },
    // nav, tabs, and control labels sit just under body text
    control: { value: '0.9375rem' },
    base: { value: '1rem' },
    lg: { value: '1.125rem' },
    xl: { value: '1.5rem' },
    '2xl': { value: '1.75rem' },
  },
  lineHeights: {
    tight: { value: '1.15' },
    base: { value: '1.6' },
  },
  sizes: {
    // the page shell: one content column shared by header, main, and footer
    pageMax: { value: '80rem' },
    contentMax: { value: '72rem' },
    readingMax: { value: '65ch' },
    formMax: { value: '32rem' },
    pageColMax: { value: '40rem' },
    touchTargetMin: { value: '44px' },
    controlHeight: { value: 'clamp(2.25rem, 2.1rem + 0.5vw, 2.75rem)' },
    controlHeightSm: { value: 'calc({sizes.controlHeight} - {spacing.1})' },
  },
  spacing: {
    // the page shell's inline gutter (header, main, and footer align on it)
    pageInline: { value: '1.75rem' },
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
    sectionGap: { value: 'clamp(2rem, 5vw, 3.5rem)' },
  },
  radii: {
    sm: { value: '2px' },
    // floating layers only (popover, menu, dialog); in-flow surfaces
    // take sm or none
    overlay: { value: '6px' },
    full: { value: '9999px' },
  },
  borders: {
    default: { value: '1px solid {colors.border}' },
    control: { value: '1px solid {colors.control.border}' },
    separator: { value: '1px solid {colors.separator}' },
    // the app's single focus ring, applied as outline: 'focusRing'
    focusRing: { value: '2px solid {colors.star}' },
  },
  // elevation is expressed by surface lightening; shadows are reserved
  // for floating layers
  shadows: {
    overlay: { value: '0 12px 28px rgba(0, 0, 0, 0.25)' },
    // contrasting layer under the focus ring when it draws over imagery
    focusHalo: { value: 'inset 0 0 0 4px {colors.bg.canvas}' },
  },
  zIndex: {
    base: { value: 0 },
    sticky: { value: 5 },
    popover: { value: 10 },
    toast: { value: 20 },
    overlay: { value: 30 },
  },
  durations: {
    micro: { value: '150ms' },
    standard: { value: '200ms' },
    // entrance choreography (load reveals, staged sequences)
    orchestrated: { value: '450ms' },
  },
  easings: {
    out: { value: 'ease-out' },
    settle: { value: 'cubic-bezier(0.22, 0.9, 0.3, 1)' },
  },
})
