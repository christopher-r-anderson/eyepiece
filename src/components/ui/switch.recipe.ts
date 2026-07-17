import { defineRecipe } from '@pandacss/dev'

export const switchRecipe = defineRecipe({
  className: 'switch',
  // typed variants are forwardable at runtime, invisible to jsx tracking
  staticCss: [{ variant: ['*'] }],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 'calc(token(sizes.controlHeight) + token(spacing.4))',
    minHeight: 'controlHeight',
    padding: '2',
    border: 'default',
    borderRadius: 'full',
    backgroundColor: 'secondary.bg',
    color: 'secondary.text',
    cursor: 'pointer',
    lineHeight: 1,
    transitionFast: 'background-color, color, border-color',
    _selected: {
      backgroundColor: 'primary.bg',
      color: 'primary.text',
      borderColor: 'transparent',
    },
    _focusVisible: {
      outline: 'focusRing',
    },
    _disabled: {
      opacity: 0.6,
      cursor: 'default',
    },
  },
  variants: {
    variant: {
      default: {},
      subtle: {
        minWidth: '2.5rem',
        minHeight: '1.5rem',
        paddingBlock: '1',
        paddingInline: '2',
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        color: 'text.muted',
        _hovered: {
          backgroundColor: 'transparent',
          color: 'text',
        },
        _selected: {
          backgroundColor: 'transparent',
          color: 'text.accent',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})
