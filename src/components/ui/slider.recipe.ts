import { defineRecipe } from '@pandacss/dev'

// per-part recipes rather than one slot recipe: the parts are separately
// exported components with no shared variants, and plain recipes can bind
// through styled()
export const sliderRecipe = defineRecipe({
  className: 'slider',
  base: {
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
})

export const sliderTrackRecipe = defineRecipe({
  className: 'slider-track',
  base: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: 'controlHeight',
  },
})

export const sliderThumbRecipe = defineRecipe({
  className: 'slider-thumb',
  base: {
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
})

export const sliderOutputRecipe = defineRecipe({
  className: 'slider-output',
  base: {
    fontSize: 'sm',
    color: 'inherit',
    padding: '3',
  },
})
