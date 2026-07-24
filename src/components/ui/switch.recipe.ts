import { defineRecipe } from '@pandacss/dev'

export const switchRecipe = defineRecipe({
  className: 'switch',
  // jit tracking: the component name does not match the recipe name
  jsx: ['Switch'],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 'calc(token(sizes.controlHeight) + token(spacing.4))',
    minHeight: 'controlHeight',
    padding: '2',
    border: 'control',
    borderRadius: 'full',
    backgroundColor: 'bg.surface.2',
    color: 'text',
    cursor: 'pointer',
    lineHeight: 1,
    transitionFast: 'background-color, color, border-color',
    _selected: {
      backgroundColor: 'accent',
      color: 'accent.fg',
      borderColor: 'transparent',
    },
    _focusVisible: {
      outline: 'focusRing',
      outlineOffset: '2px',
    },
    _disabled: {
      opacity: 0.6,
      cursor: 'default',
    },
  },
  variants: {
    variant: {
      default: {},
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})
