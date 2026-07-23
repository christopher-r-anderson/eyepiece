import { defineRecipe } from '@pandacss/dev'
import { ghostVisualStyles } from './button.styles'
import { tabSelectedStyles, tabVisualStyles } from './tab.styles'

export const linkRecipe = defineRecipe({
  className: 'link',
  base: {
    color: 'accent.emphasis',
    textDecoration: 'none',
    transitionFast: 'color',
    _hovered: { textDecoration: 'underline' },
    _focusVisible: {
      outline: 'focusRing',
      outlineOffset: '2px',
    },
  },
  variants: {
    variant: {
      // a link that navigates between tab-like panels; selection comes from
      // aria-current, not react aria's data-selected
      tab: {
        ...tabVisualStyles,
        textDecoration: 'none',
        _hovered: { textDecoration: 'none' },
        '&[aria-current="page"]': tabSelectedStyles,
        _focusVisible: { outlineOffset: '0' },
      },
      // a link dressed as a compact ghost button
      ghost: {
        ...ghostVisualStyles,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2',
        minHeight: 'controlHeightSm',
        paddingBlock: '2',
        paddingInline: '3',
        borderRadius: 'md',
        fontWeight: 600,
        lineHeight: 'tight',
        _hovered: {
          ...ghostVisualStyles._hovered,
          textDecoration: 'none',
        },
      },
    },
    // explicit underline for links that sit in running text, where the
    // hover-only affordance isn't enough
    underline: {
      true: { textDecoration: 'underline' },
    },
  },
})
