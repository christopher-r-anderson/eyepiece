import { defineRecipe } from '@pandacss/dev'
import { panelSurfaceStyles } from './surface.styles'

export const formRecipe = defineRecipe({
  className: 'form',
  // surface is prop-drilled through the feature form components, so jit
  // tracking never sees a literal value
  staticCss: [{ surface: ['*'] }],
  base: {
    display: 'grid',
    gap: '4',
    width: 'full',
    maxWidth: 'formMax',
    padding: '4',
    margin: '0 auto',
  },
  variants: {
    surface: {
      plain: {},
      panel: panelSurfaceStyles,
    },
  },
  defaultVariants: {
    surface: 'plain',
  },
})
