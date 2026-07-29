import { defineStyles } from '@pandacss/dev'

// the app's one panel-surface treatment, shared by the form recipe's panel
// variant and the dev panels. Keep this module free of react or
// styled-system imports - it is evaluated inside panda.config.
export const panelSurfaceStyles = defineStyles({
  padding: '5',
  border: 'default',
  borderRadius: 'sm',
  backgroundColor: 'bg.surface.2',
})
