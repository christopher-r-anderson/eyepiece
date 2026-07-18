import { defineSlotRecipe } from '@pandacss/dev'

export const selectRecipe = defineSlotRecipe({
  className: 'select',
  slots: ['root', 'item', 'caret'],
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
    },
    // shared by the trigger's SelectValue and the listbox option contents
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      cursor: 'pointer',
      lineHeight: 'tight',
    },
    caret: {
      display: 'inline-flex',
      alignItems: 'center',
    },
  },
})
