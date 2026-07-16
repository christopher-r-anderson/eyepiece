import { defineRecipe } from '@pandacss/dev'

export const formRecipe = defineRecipe({
  className: 'form',
  staticCss: ['*'],
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
