import { defineConfig } from '@pandacss/dev'
import { globalCss } from './panda/global-css'
import { semanticTokens } from './panda/semantic-tokens'
import { tokens } from './panda/tokens'

export default defineConfig({
  presets: ['@pandacss/preset-base'],
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  outdir: 'styled-system',
  globalCss,
  utilities: {
    extend: {
      // CSS properties missing from Panda's generated property set
      viewTransitionClass: { className: 'view-transition-class' },
      WebkitBoxOrient: { className: 'webkit-box-orient' },
      // expands to the app's standard transition (fast duration, default
      // easing) over the given property list
      transitionFast: {
        className: 'transition-fast',
        values: { type: 'string' },
        transform(value: string, { token }) {
          return {
            transitionProperty: value,
            transitionDuration: token('durations.fast'),
            transitionTimingFunction: token('easings.default'),
          }
        },
      },
    },
  },
  conditions: {
    extend: {
      // react-aria-components state attributes. pressed and selected
      // intentionally replace Panda's aria-inclusive defaults: RAC sets
      // aria-pressed to reflect a ToggleButton's toggled state, so
      // [aria-pressed=true] would apply momentary-press styles to every
      // toggled-on button.
      hovered: '&[data-hovered]',
      pressed: '&[data-pressed]',
      focused: '&[data-focused]',
      selected: '&[data-selected]',
      // binds _dark to the app's theme mechanism (see theme-provider.tsx)
      dark: ':root[data-theme=dark] &',
    },
  },
  theme: {
    // standard container query ladder, used as '@/xl' etc. against the
    // nearest containerType ancestor
    containerSizes: {
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      '4xl': '56rem',
      '5xl': '64rem',
    },
    tokens,
    semanticTokens,
  },
})
