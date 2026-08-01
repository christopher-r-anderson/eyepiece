import { defineRecipe } from '@pandacss/dev'

export const popoverRecipe = defineRecipe({
  className: 'popover',
  base: {
    border: 'default',
    borderRadius: 'overlay',
    backgroundColor: 'bg.canvas',
    boxShadow: 'overlay',
    overflow: 'hidden',
    // scoped to entering: react aria reads a non-none animation on close
    // as an exit animation and waits for it
    '&[data-entering]': {
      animationName: 'fade',
      animationDuration: 'micro',
      animationTimingFunction: 'out',
      _motionReduce: { animation: 'none' },
    },
  },
})
