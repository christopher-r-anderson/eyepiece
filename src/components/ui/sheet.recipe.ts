import { defineSlotRecipe } from '@pandacss/dev'

// near-fullscreen modal surface: the page stays visible in a top gap (and
// side gaps on desktop), where the close control also lives
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
      // gaps live on the overlay so clicks in them count as outside the
      // modal and dismiss it
      paddingTop: '6',
      md: {
        paddingTop: '7',
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
      borderTopRadius: 'overlay',
      boxShadow: 'overlay',
      md: {
        border: 'default',
        borderBottom: 'none',
      },
    },
    close: {
      // sits in the overlay's top gap, centered on it; stays inside the
      // dialog subtree so the modal focus trap can reach it
      position: 'absolute',
      top: 'calc((token(spacing.6) + token(sizes.touchTargetMin)) / -2)',
      right: '3',
      minWidth: 'touchTargetMin',
      minHeight: 'touchTargetMin',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(255, 255, 255, 0.8)',
      _hovered: { color: 'white' },
      _focusVisible: {
        outline: 'focusRing',
        outlineOffset: '2px',
      },
      md: {
        top: 'calc((token(spacing.7) + token(sizes.touchTargetMin)) / -2)',
        right: '0',
      },
    },
    body: {
      minHeight: 0,
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6',
      paddingTop: '4',
      paddingBottom: '8',
    },
  },
})
