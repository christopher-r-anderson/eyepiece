import { defineStyles } from '@pandacss/dev'

// plain style objects, shared by definition: tabs.tsx composes them for RAC
// Tabs and link.recipe.ts reuses them for links that navigate between
// scope panels. Keep this module free of react or styled-system imports -
// it is evaluated inside panda.config.

export const tabVisualStyles = defineStyles({
  minHeight: 'controlHeight',
  paddingBlock: '2',
  paddingInline: '4',
  border: 'default',
  borderBottomWidth: 0,
  borderTopRadius: 'sm',
  backgroundColor: 'bg.surface.2',
  color: 'text',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  outline: 'none',
  transitionFast: 'background-color, color',
})

export const tabSelectedStyles = defineStyles({
  fontWeight: 'bold',
  backgroundColor: 'bg.surface.3',
  position: 'relative',
  zIndex: 1,
})

export const tabListStyles = defineStyles({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  alignItems: 'end',
  marginBottom: '-1px',
})

export const tabPanelStyles = defineStyles({
  backgroundColor: 'bg.surface.3',
  border: 'default',
  borderRadius: '0 token(radii.sm) token(radii.sm) token(radii.sm)',
  padding: '4',
})
