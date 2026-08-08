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
      // scoped to entering: react aria reads a non-none animation on close
      // as an exit animation and waits for it
      '&[data-entering]': {
        animationName: 'fade',
        animationDuration: 'standard',
        _motionReduce: { animation: 'none' },
      },
      // gaps live on the overlay so clicks in them count as outside the
      // modal and dismiss it; the close slot positions itself off the same
      // variable, so the gap has one home. One size at every breakpoint:
      // a narrower gap cannot fit the close button
      '--sheet-gap': 'token(spacing.7)',
      paddingTop: 'var(--sheet-gap)',
      md: {
        paddingInline: '8',
      },
    },
    modal: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      // the rise lives here, not on the dialog: only the overlay and modal
      // elements carry react aria's entering state
      '&[data-entering]': {
        animationName: 'settle',
        animationDuration: 'orchestrated',
        animationTimingFunction: 'settle',
        _motionReduce: { animation: 'none' },
      },
    },
    dialog: {
      position: 'relative',
      backgroundColor: 'bg.canvas',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      outline: 'none',
      borderTop: 'default',
      borderTopRadius: 'overlay',
      boxShadow: 'overlay',
      md: {
        border: 'default',
        borderBottom: 'none',
      },
    },
    close: {
      // sits in the overlay's top gap (--sheet-gap); stays inside the
      // dialog subtree so the modal focus trap can reach it. position is
      // patched through the css prop in sheet.tsx (layer order, see the
      // button recipe's icon variant)
      // centered in the gap at every breakpoint
      top: 'calc((var(--sheet-gap) + token(sizes.controlHeightSm)) / -2)',
      right: '3',
      // over the dimmed backdrop the glyph stays light and hover speaks
      // through color alone
      '--button-icon-color': 'rgba(255, 255, 255, 0.8)',
      '--button-icon-hover-color': 'white',
      '--button-icon-hover-bg': 'transparent',
      md: {
        right: '0',
      },
    },
    body: {
      minHeight: 0,
      flex: 1,
      // the scrollport is a size container so content can floor itself
      // against it in cq units (a percentage cannot resolve through
      // intermediate auto-height wrappers)
      containerType: 'size',
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
