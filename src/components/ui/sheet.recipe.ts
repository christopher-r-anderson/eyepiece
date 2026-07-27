import { defineSlotRecipe } from '@pandacss/dev'

// near-fullscreen modal surface: the page stays visible in gaps at the top
// and sides on desktop; mobile goes full-bleed
export const sheetRecipe = defineSlotRecipe({
  className: 'sheet',
  slots: ['overlay', 'modal', 'dialog', 'close', 'body'],
  base: {
    overlay: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      position: 'fixed',
      inset: 0,
      zIndex: 'overlay',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      // the gaps live on the overlay so clicks in them count as outside
      // the modal and dismiss it
      md: {
        // the spacing scale ends at 8
        paddingTop: 'calc(token(spacing.8) + token(spacing.2))',
        paddingInline: '8',
      },
    },
    modal: {
      width: '100%',
      height: '100%',
      minHeight: 0,
    },
    dialog: {
      position: 'relative',
      backgroundColor: 'bg.canvas',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      outline: 'none',
      md: {
        border: 'default',
        borderBottom: 'none',
        borderTopRadius: 'overlay',
        boxShadow: 'overlay',
      },
    },
    close: {
      position: 'absolute',
      top: '3',
      right: '3',
      zIndex: 1,
    },
    body: {
      minHeight: 0,
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6',
      // clears the floating close button
      paddingTop: 'calc(token(spacing.8) + token(spacing.6))',
      paddingBottom: '8',
    },
  },
})
