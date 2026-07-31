import { defineRecipe } from '@pandacss/dev'
import { ghostCompactGeometry, ghostVisualStyles } from './button.styles'

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
      // a link dressed as a compact ghost button
      ghost: {
        ...ghostVisualStyles,
        ...ghostCompactGeometry,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2',
        borderRadius: 'sm',
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
