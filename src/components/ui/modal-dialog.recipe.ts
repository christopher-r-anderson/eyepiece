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
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modal: {
      maxHeight: '100vh',
      padding: '6',
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
