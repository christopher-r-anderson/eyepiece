import { defineRecipe } from '@pandacss/dev'

export const listBoxRecipe = defineRecipe({
  className: 'list-box',
  base: {
    display: 'grid',
    gap: '1',
    minWidth: '16ch',
    padding: '2',
    borderRadius: 'lg',
    border:
      '1px solid color-mix(in oklab, token(colors.border) 85%, token(colors.text) 15%)',
    backgroundColor:
      'color-mix(in oklab, token(colors.secondary.bg) 92%, token(colors.background) 8%)',
    color: 'secondary.text',
    boxShadow: 'sm',
    outline: 'none',
  },
})

export const listBoxItemRecipe = defineRecipe({
  className: 'list-box-item',
  base: {
    paddingBlock: '2',
    paddingInline: '3',
    borderRadius: 'md',
    cursor: 'pointer',
    outline: 'none',
    transitionFast: 'background-color, color',
    '&[data-hovered], &[data-focused], &[data-selected]': {
      backgroundColor: 'tertiary.bg',
      color: 'tertiary.text',
    },
    _focusVisible: {
      outline: 'focusRing',
    },
  },
})
