import { defineSlotRecipe } from '@pandacss/dev'

export const tabsRecipe = defineSlotRecipe({
  className: 'tabs',
  slots: ['root', 'list', 'tab', 'panels', 'panel'],
  base: {
    root: {
      display: 'grid',
      width: '100%',
    },
    list: {
      display: 'flex',
      alignItems: 'center',
      gap: '5',
      borderBottom: 'default',
    },
    tab: {
      fontSize: 'control',
      color: 'text.muted',
      cursor: 'pointer',
      paddingBlock: '1',
      // the selected rule replaces the list hairline underneath it
      marginBottom: '-1px',
      borderBottom: '1px solid transparent',
      transitionFast: 'color, border-color',
      outline: 'none',
      _hovered: { color: 'text' },
      _selected: { color: 'text', borderBottomColor: 'accent' },
      _focusVisible: { outline: 'focusRing', outlineOffset: '2px' },
    },
    panels: {
      display: 'grid',
    },
    panel: {
      paddingTop: '4',
      outline: 'none',
      _focusVisible: { outline: 'focusRing' },
    },
  },
})
