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
    border: 'default',
    backgroundColor: 'tertiary.bg',
    color: 'text',
    boxShadow: 'sm',
  },
})
