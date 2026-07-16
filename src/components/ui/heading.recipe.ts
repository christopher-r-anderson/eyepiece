import { defineRecipe } from '@pandacss/dev'

export const headingRecipe = defineRecipe({
  className: 'heading',
  staticCss: ['*'],
  base: {
    margin: 0,
    color: 'inherit',
    fontFamily: 'inherit',
    fontWeight: 700,
    lineHeight: 'tight',
  },
  variants: {
    level: {
      1: { fontSize: '2xl', marginBlockEnd: '5' },
      2: { fontSize: 'xl', marginBlockEnd: '4' },
      3: { fontSize: 'lg', marginBlockEnd: '3' },
      4: { fontSize: 'base', marginBlockEnd: '3' },
      5: { fontSize: 'sm', marginBlockEnd: '2' },
      6: { fontSize: 'xs', marginBlockEnd: '2' },
    },
  },
})
