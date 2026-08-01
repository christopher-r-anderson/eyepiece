import { defineSlotRecipe } from '@pandacss/dev'

export const modalDialogRecipe = defineSlotRecipe({
  className: 'modal-dialog',
  slots: ['overlay', 'modal', 'dialog', 'header', 'body'],
  base: {
    overlay: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      inset: 0,
      zIndex: 'overlay',
      // one backdrop strength across modal surfaces (the sheet set it)
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      // scoped to entering: react aria reads a non-none animation on close
      // as an exit animation and waits for it
      '&[data-entering]': {
        animationName: 'fade',
        animationDuration: 'standard',
        _motionReduce: { animation: 'none' },
      },
    },
    modal: {
      maxHeight: '100vh',
      padding: '6',
      '&[data-entering]': {
        animationName: 'settle',
        animationDuration: 'standard',
        animationTimingFunction: 'settle',
        _motionReduce: { animation: 'none' },
      },
    },
    dialog: {
      backgroundColor: 'bg.canvas',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '90vh',
      maxWidth: '90vw',
      border: 'default',
      borderRadius: 'overlay',
      boxShadow: 'overlay',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '3',
      paddingTop: '4',
      paddingInline: '5',
      paddingBottom: '3',
    },
    body: {
      minHeight: 0,
      overflowY: 'auto',
      paddingTop: 0,
      paddingInline: '5',
      paddingBottom: '5',
    },
  },
})
