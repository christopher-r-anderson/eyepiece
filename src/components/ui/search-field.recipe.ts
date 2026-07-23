import { defineRecipe } from '@pandacss/dev'

export const searchFieldRecipe = defineRecipe({
  className: 'search-field',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    width: '100%',
    minHeight: 'controlHeight',
    paddingInline: '3',
    gap: '2',
    borderRadius: 'full',
    border: 'control',
    backgroundColor: 'bg.surface.3',
    color: 'text',
    boxShadow: 'sm',
    transitionFast: 'border-color, outline-color',
    _focusWithin: {
      outline: 'focusRing',
      outlineOffset: '1px',
    },
  },
})
