import type { SystemStyleObject } from 'styled-system/types'

// evaluated inside panda.config: no runtime react or styled-system
// imports (type-only imports are erased). satisfies keeps the literal
// type the form recipe's spread needs.
export const panelSurfaceStyles = {
  padding: '5',
  border: 'default',
  borderRadius: 'sm',
  backgroundColor: 'bg.surface.2',
} as const satisfies SystemStyleObject
