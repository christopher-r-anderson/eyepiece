import { defineSlotRecipe } from '@pandacss/dev'

export const sliderRecipe = defineSlotRecipe({
  className: 'slider',
  slots: ['root', 'track', 'thumb', 'output'],
  base: {
    root: {
      display: 'grid',
      gap: '3',
      width: '100%',
      paddingTop: '1',
      paddingInline: '5',
      paddingBottom: '3',
      borderRadius: 'lg',
      backgroundColor: 'secondary.bg',
      color: 'secondary.text',
    },
    track: {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      minHeight: 'controlHeight',
    },
    thumb: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 'controlHeight',
      minHeight: 'controlHeight',
      color: 'inherit',
      cursor: 'pointer',
      outline: 'none',
      _focusVisible: {
        outline: 'focusRing',
      },
    },
    output: {
      fontSize: 'sm',
      color: 'inherit',
      padding: '3',
    },
  },
})
