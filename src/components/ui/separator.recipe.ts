import { defineRecipe } from '@pandacss/dev'

export const separatorRecipe = defineRecipe({
  className: 'separator',
  base: {
    border: 0,
    borderTop: 'separator',
    marginBlock: '1',
    marginInline: '2',
  },
})
