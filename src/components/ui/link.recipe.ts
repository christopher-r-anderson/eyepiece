import { defineRecipe } from '@pandacss/dev'

export const linkRecipe = defineRecipe({
  className: 'link',
  base: {
    color: 'link',
    textDecoration: 'none',
    transitionFast: 'color',
    _hovered: { textDecoration: 'underline' },
    _focusVisible: {
      outline: 'focusRing',
      outlineOffset: '2px',
    },
  },
})
