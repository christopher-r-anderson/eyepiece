import { defineRecipe } from '@pandacss/dev'

export const popoverRecipe = defineRecipe({
  className: 'popover',
  base: {
    border: 'default',
    borderRadius: 'lg',
    backgroundColor: 'bg.canvas',
    boxShadow: 'md',
    overflow: 'hidden',
  },
})
