import { defineRecipe } from '@pandacss/dev'

export const formRecipe = defineRecipe({
  className: 'form',
  // surface is prop-drilled through the feature form components, so jit
  // tracking never sees a literal value
  staticCss: [{ surface: ['*'] }],
  base: {
    width: '100%',
    padding: '4',
    margin: '0 auto',
    // the container context for the @/* conditions used by form descendants
    containerType: 'inline-size',
  },
  variants: {
    surface: {
      plain: {},
      panel: {
        padding: '5',
        border: 'default',
        borderRadius: 'lg',
        backgroundColor: 'secondary.bg',
        boxShadow: 'sm',
      },
    },
  },
  defaultVariants: {
    surface: 'plain',
  },
})
