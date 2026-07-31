import { defineSlotRecipe } from '@pandacss/dev'

export const toastRecipe = defineSlotRecipe({
  className: 'toast',
  slots: ['region', 'root', 'content', 'title'],
  base: {
    region: {
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      zIndex: 'toast',
      bottom: '7',
      right: '7',
      gap: '2',
      maxWidth:
        'min(token(sizes.readingMax), calc(100vw - (2 * token(spacing.7))))',
    },
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      animationName: 'settle',
      animationDuration: 'orchestrated',
      animationTimingFunction: 'settle',
      _motionReduce: { animation: 'none' },
      backgroundColor: 'bg.surface.2',
      color: 'text',
      border: 'default',
      borderRadius: 'overlay',
      boxShadow: 'overlay',
      padding: '4',
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
    },
    title: {
      fontWeight: 700,
      lineHeight: 'tight',
    },
  },
})
