import { defineRecipe } from '@pandacss/dev'

export const popoverRecipe = defineRecipe({
  className: 'popover',
  base: {
    border: 'default',
    borderRadius: 'overlay',
    backgroundColor: 'bg.canvas',
    boxShadow: 'overlay',
    overflow: 'hidden',
  },
})
