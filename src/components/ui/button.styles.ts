import type { SystemStyleObject } from 'styled-system/types'

// evaluated inside panda.config: no runtime react or styled-system
// imports (type-only imports are erased). satisfies keeps the literal
// types the recipe spreads need; defineStyles widens them until recipe
// type-checking fails.

export const ghostVisualStyles = {
  border: 'transparent',
  backgroundColor: 'transparent',
  color: 'text.muted',
  _hovered: {
    color: 'text',
    border: 'control',
    backgroundColor: 'bg.surface.2',
  },
} as const satisfies SystemStyleObject

export const ghostCompactGeometry = {
  minHeight: 'controlHeightSm',
  paddingBlock: '2',
  paddingInline: '3',
} as const satisfies SystemStyleObject

// extends the tap area to touchTargetMin without growing the visible box;
// shared by the button and toggle-button icon variants
export const touchHitAreaStyles = {
  position: 'relative',
  _before: {
    content: '""',
    position: 'absolute',
    inset: '[calc(50% - token(sizes.touchTargetMin) / 2)]',
  },
} as const satisfies SystemStyleObject
