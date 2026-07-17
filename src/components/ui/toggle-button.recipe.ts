import { defineRecipe } from '@pandacss/dev'

export const toggleButtonRecipe = defineRecipe({
  className: 'toggle-button',
  // typed variants are forwardable at runtime, invisible to jsx tracking
  staticCss: [{ variant: ['*'] }],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'controlHeight',
    minWidth: 'controlHeight',
    padding: '2',
    borderRadius: 'md',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    color: 'text.muted',
    cursor: 'pointer',
    lineHeight: 1,
    transitionFast: 'background-color, color, border-color',
    _hovered: {
      backgroundColor: 'tertiary.bg',
      color: 'tertiary.text',
    },
    _selected: {
      backgroundColor: 'secondary.bg',
      color: 'text.accent',
      borderColor: 'border',
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
        _selected: {
          backgroundColor: 'transparent',
          color: 'text.accent',
          borderColor: 'transparent',
        },
      },
      // the --toggle-icon-* custom properties are the per-instance theming
      // channel; consumers set them through the css prop
      icon: {
        minHeight: 'auto',
        minWidth: 'auto',
        padding: '0',
        borderRadius: 'sm',
        border: 'none',
        backgroundColor: 'transparent',
        color: 'var(--toggle-icon-color, token(colors.text.muted))',
        transitionFast: 'color, filter, transform, outline-color',
        _hovered: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: 'var(--toggle-icon-hover-color, token(colors.text))',
          filter:
            'drop-shadow(0 0 0.45rem var(--toggle-icon-hover-glow, transparent))',
        },
        _selected: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: 'var(--toggle-icon-selected-color, token(colors.text.accent))',
          filter:
            'drop-shadow(0 0 0.6rem var(--toggle-icon-selected-glow, transparent))',
        },
        _focusVisible: {
          outline: 'focusRing',
          outlineOffset: '3px',
        },
        _disabled: {
          opacity: 0.5,
          cursor: 'default',
          filter: 'none',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})
