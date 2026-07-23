import { defineSlotRecipe } from '@pandacss/dev'

export const toastRecipe = defineSlotRecipe({
  className: 'toast',
  slots: ['region', 'root', 'content', 'title'],
  base: {
    region: {
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      bottom: '7',
      right: '7',
      gap: '2',
      maxWidth:
        'min(token(sizes.readingMax), calc(100vw - (2 * token(spacing.7))))',
    },
    root: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '2',
      backgroundColor: 'bg.surface.2',
      color: 'text',
      // decorative surface outline, deliberately not the focusRing border token
      outline: '1px solid token(colors.separator)',
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
