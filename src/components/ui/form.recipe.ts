import { defineRecipe } from '@pandacss/dev'

export const formRecipe = defineRecipe({
  className: 'form',
  // surface and layout are prop-drilled through the feature form
  // components, so jit tracking never sees a literal value
  staticCss: [{ surface: ['*'], layout: ['*'] }],
  base: {
    display: 'grid',
    gap: '4',
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
        borderRadius: 'sm',
        backgroundColor: 'bg.surface.2',
      },
    },
    // action forms are always stacked; page forms name their container so
    // descendants' '@form/*' states can respond to real width
    layout: {
      action: {},
      page: {
        containerName: 'form',
      },
    },
  },
  defaultVariants: {
    surface: 'plain',
    layout: 'action',
  },
})
