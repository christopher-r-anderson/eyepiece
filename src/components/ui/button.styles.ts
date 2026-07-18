import { defineStyles } from '@pandacss/dev'

// the ghost treatment, shared by definition between button.recipe.ts and
// link.recipe.ts (a Link can't be a RAC Button, so ghost-looking links
// reuse the same object instead of copying it). Keep this module free of
// react or styled-system imports - it is evaluated inside panda.config.

export const ghostVisualStyles = defineStyles({
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: 'primary.textMuted',
  _hovered: {
    color: 'text',
    border: 'control',
    backgroundColor:
      'color-mix(in oklab, token(colors.tertiary.bg) 72%, token(colors.background) 28%)',
  },
})
