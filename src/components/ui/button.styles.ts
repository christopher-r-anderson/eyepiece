import { defineStyles } from '@pandacss/dev'

// the ghost treatment, shared by definition between button.recipe.ts and
// link.recipe.ts (a Link can't be a RAC Button, so ghost-looking links
// reuse the same object instead of copying it). Keep this module free of
// react or styled-system imports - it is evaluated inside panda.config.

export const ghostVisualStyles = defineStyles({
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: 'text.muted',
  _hovered: {
    color: 'text',
    border: 'control',
    backgroundColor: 'bg.surface.2',
  },
})

export const ghostCompactGeometry = defineStyles({
  minHeight: 'controlHeightSm',
  paddingBlock: '2',
  paddingInline: '3',
})

// extends the hit area to touchTargetMin without growing the visible box,
// whatever size that box is; shared by the button and toggle-button icon
// variants. Pseudo hit areas are invisible to target-size audits - this
// is touch comfort on top of a compliant box, not compliance itself
export const touchHitAreaStyles = defineStyles({
  position: 'relative',
  _before: {
    content: '""',
    position: 'absolute',
    inset: 'calc(50% - token(sizes.touchTargetMin) / 2)',
  },
})
