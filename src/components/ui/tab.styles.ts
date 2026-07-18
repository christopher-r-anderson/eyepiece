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
  borderTopRadius: 'md',
  backgroundColor: 'secondary.bg',
  color: 'secondary.text',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  outline: 'none',
  transitionFast: 'background-color, color',
})

export const tabSelectedStyles = defineStyles({
  fontWeight: 'bold',
  backgroundColor: 'tertiary.bg',
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
  backgroundColor: 'tertiary.bg',
  border: 'default',
  borderRadius: '0 token(radii.lg) token(radii.lg) token(radii.lg)',
  padding: '4',
})
