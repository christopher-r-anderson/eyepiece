import { defineSlotRecipe } from '@pandacss/dev'

export const textFieldRecipe = defineSlotRecipe({
  className: 'text-field',
  slots: ['root', 'label', 'control', 'input', 'description', 'error'],
  base: {
    root: {
      display: 'grid',
      minWidth: 0,
    },
    label: {
      textAlign: 'left',
    },
    // the visual field surface; the input itself stays chromeless
    control: {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'row',
      width: '100%',
      minWidth: 0,
      minHeight: 'controlHeight',
      paddingInline: '3',
      gap: '2',
      borderRadius: 'sm',
      border: 'control',
      backgroundColor: 'bg.surface.2',
      color: 'text',
      transitionFast: 'border-color, outline-color',
      _focusWithin: {
        borderColor: 'accent',
      },
      '&:has([data-focus-visible])': {
        outline: 'focusRing',
        outlineOffset: '2px',
      },
    },
    input: {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      minHeight: 'calc(token(sizes.controlHeight) - 2px)',
      paddingBlock: '2',
      border: 0,
      outline: 'none',
      backgroundColor: 'transparent',
      color: 'inherit',
      caretColor: 'currentColor',
      '&:focus': {
        outline: 'none',
      },
      _autofill: {
        boxShadow: 'inset 0 0 0 100px token(colors.bg.surface.2)',
        WebkitTextFillColor: 'token(colors.text)',
      },
    },
    description: {
      fontSize: 'xs',
      marginTop: '2',
    },
    error: {
      color: 'danger.text',
      fontSize: 'sm',
      paddingBlockStart: '2',
    },
  },
})
