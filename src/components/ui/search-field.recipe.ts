import { defineRecipe } from '@pandacss/dev'

// the underline field voice: transparent fill, a control-strength bottom
// rule that shifts to the accent while focused; the keyboard ring rides
// the whole field so the chromeless input stays visibly focusable
export const searchFieldRecipe = defineRecipe({
  className: 'search-field',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    width: '100%',
    minHeight: 'controlHeight',
    gap: '2',
    borderBottom: 'control',
    backgroundColor: 'transparent',
    color: 'text',
    transitionFast: 'border-color',
    _focusWithin: {
      borderColor: 'accent',
    },
    // react aria's modality tracking, not css :focus-visible - text inputs
    // match the pseudo-class on mouse focus too, and mouse users already
    // get the accent underline
    '&:has([data-focus-visible])': {
      outline: 'focusRing',
      outlineOffset: '2px',
    },
    // hidden, not removed: the geometry stays reserved so text never
    // shifts when the button appears
    '&[data-empty] [data-clear-button]': {
      visibility: 'hidden',
    },
  },
})
