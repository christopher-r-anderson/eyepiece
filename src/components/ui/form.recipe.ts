import { defineRecipe } from '@pandacss/dev'

export const formRecipe = defineRecipe({
  className: 'form',
  // surface is prop-drilled through the feature form components, so jit
  // tracking never sees a literal value
  staticCss: [{ surface: ['*'] }],
  base: {
    display: 'grid',
    gap: '4',
    width: '100%',
    maxWidth: 'formMax',
    padding: '4',
    margin: '0 auto',
  },
  variants: {
    surface: {
      plain: {},
      panel: {
        padding: '5',
        border: 'default',
        borderRadius: 'sm',
        backgroundColor: 'bg.surface.2',
      },
    },
  },
  defaultVariants: {
    surface: 'plain',
  },
})
