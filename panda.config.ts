import { defineConfig } from '@pandacss/dev'
import { globalCss } from './panda/global-css'
import { semanticTokens } from './panda/semantic-tokens'
import { tokens } from './panda/tokens'
import { buttonRecipe } from '@/components/ui/button.recipe'
import { formRecipe } from '@/components/ui/form.recipe'
import { headingRecipe } from '@/components/ui/heading.recipe'
import { linkRecipe } from '@/components/ui/link.recipe'
import {
  listBoxItemRecipe,
  listBoxRecipe,
} from '@/components/ui/list-box.recipe'
import { menuItemRecipe, menuRecipe } from '@/components/ui/menus.recipe'
import { modalDialogRecipe } from '@/components/ui/modal-dialog.recipe'
import { popoverRecipe } from '@/components/ui/popover.recipe'
import { searchFieldRecipe } from '@/components/ui/search-field.recipe'
import { selectRecipe } from '@/components/ui/select.recipe'
import { separatorRecipe } from '@/components/ui/separator.recipe'
import {
  sliderOutputRecipe,
  sliderRecipe,
  sliderThumbRecipe,
  sliderTrackRecipe,
} from '@/components/ui/slider.recipe'
import { switchRecipe } from '@/components/ui/switch.recipe'
import { textFieldRecipe } from '@/components/ui/text-field.recipe'
import { toastRecipe } from '@/components/ui/toast.recipe'
import { toggleButtonRecipe } from '@/components/ui/toggle-button.recipe'

export default defineConfig({
  presets: ['@pandacss/preset-base'],
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  outdir: 'styled-system',
  jsxFramework: 'react',
  // styled components take only the css prop; no utility shorthand props
  jsxStyleProps: 'minimal',
  globalCss,
  // the icon toggle-button's per-instance theming channel, set by consumers
  // through the css prop; registered for typing and autocomplete only
  // (universal syntax + no initial value keeps the variant fallbacks active)
  globalVars: {
    '--toggle-icon-color': { syntax: '*', inherits: true },
    '--toggle-icon-hover-color': { syntax: '*', inherits: true },
    '--toggle-icon-hover-glow': { syntax: '*', inherits: true },
    '--toggle-icon-selected-color': { syntax: '*', inherits: true },
    '--toggle-icon-selected-glow': { syntax: '*', inherits: true },
  },
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
    recipes: {
      button: buttonRecipe,
      form: formRecipe,
      heading: headingRecipe,
      link: linkRecipe,
      listBox: listBoxRecipe,
      listBoxItem: listBoxItemRecipe,
      menu: menuRecipe,
      menuItem: menuItemRecipe,
      popover: popoverRecipe,
      searchField: searchFieldRecipe,
      separator: separatorRecipe,
      slider: sliderRecipe,
      sliderOutput: sliderOutputRecipe,
      sliderThumb: sliderThumbRecipe,
      sliderTrack: sliderTrackRecipe,
      // key avoids generating an unimportable `switch` binding
      switchRecipe: switchRecipe,
      toggleButton: toggleButtonRecipe,
    },
    slotRecipes: {
      modalDialog: modalDialogRecipe,
      select: selectRecipe,
      textField: textFieldRecipe,
      toast: toastRecipe,
    },
  },
})
