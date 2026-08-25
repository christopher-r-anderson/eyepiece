import { defineGlobalStyles } from '@pandacss/dev'

// app opinions only - element normalization comes from Panda's preflight
export const globalCss = defineGlobalStyles({
  ':root': {
    '--global-font-body': 'token(fonts.sans)',
    '--global-font-mono': 'token(fonts.mono)',
    '--global-color-placeholder': 'token(colors.text.muted)',
  },
  html: {
    // Reserve the one-sided gutter even on short pages. React Aria currently
    // writes the same value inline while scroll locking when it detects a
    // classic gutter; `!important` keeps this app-owned contract authoritative
    // if that behavior ever diverges.
    scrollbarGutter: 'stable !important',
    // keyboard focus and anchor jumps must land below the sticky header
    scrollPaddingTop: 'token(sizes.stickyHeader)',
    background: 'bg.canvas',
    color: 'text',
  },
  body: {
    fontSize: 'base',
    lineHeight: 'base',
  },
  a: {
    color: 'accent.emphasis',
    // preflight sets text-decoration: inherit, so the underline is explicit
    textDecorationLine: 'underline',
    textDecorationThickness: '0.08em',
    textUnderlineOffset: '0.18em',
  },
  // preflight unstyles lists; content lists get browser markers back and
  // component lists opt back out locally
  'ul, ol': {
    listStyle: 'revert',
    paddingInlineStart: '1.25em',
  },
})
