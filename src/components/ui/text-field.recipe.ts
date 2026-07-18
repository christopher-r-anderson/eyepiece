import { defineSlotRecipe } from '@pandacss/dev'

export const textFieldRecipe = defineSlotRecipe({
  className: 'text-field',
  slots: ['root', 'label', 'control', 'input', 'description', 'error'],
  base: {
    // spans and subdivides the InputGroup grid
    root: {
      gridColumn: '1 / -1',
      display: 'grid',
      gridTemplateColumns: 'subgrid',
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
      borderRadius: 'md',
      border: 'control',
      backgroundColor: 'secondary.bg',
      color: 'secondary.text',
      boxShadow: 'sm',
      transitionFast: 'border-color, outline-color',
      _focusWithin: {
        outline: 'focusRing',
        outlineOffset: '1px',
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
        boxShadow: 'inset 0 0 0 100px token(colors.secondary.bg)',
        WebkitTextFillColor: 'token(colors.secondary.text)',
      },
    },
    description: {
      fontSize: 'xs',
      marginTop: '2',
      gridColumn: '1 / -1',
    },
    error: {
      color: 'danger.text',
      fontSize: 'sm',
      gridColumn: '1 / -1',
      paddingBlockStart: '2',
    },
  },
})
