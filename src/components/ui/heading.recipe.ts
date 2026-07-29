import { defineRecipe } from '@pandacss/dev'

export const headingRecipe = defineRecipe({
  className: 'heading',
  // level is drilled and computed, which no jit tracking can see
  staticCss: [{ level: ['*'] }],
  base: {
    color: 'inherit',
    fontFamily: 'inherit',
    fontWeight: 700,
    lineHeight: 'tight',
  },
  variants: {
    level: {
      1: { fontSize: '2xl' },
      2: { fontSize: 'xl' },
      3: { fontSize: 'lg' },
    },
  },
})
