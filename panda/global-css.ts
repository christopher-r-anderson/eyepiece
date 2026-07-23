import { defineGlobalStyles } from '@pandacss/dev'

// app opinions only - element normalization comes from Panda's preflight
export const globalCss = defineGlobalStyles({
  ':root': {
    '--global-font-body': 'token(fonts.sans)',
    '--global-font-mono': 'token(fonts.mono)',
    '--global-color-placeholder': 'token(colors.text.muted)',
  },
  html: {
    // react aria sets stable (not stable both-edges) which causes a jump in layout when a popover shows
    scrollbarGutter: 'stable both-edges !important',
    background: 'bg.canvas',
    color: 'text',
  },
  "html[data-modal-open='true']": {
    scrollbarGutter: 'auto !important',
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
