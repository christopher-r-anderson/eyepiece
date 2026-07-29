import { defineRecipe } from '@pandacss/dev'

export const toggleButtonRecipe = defineRecipe({
  className: 'toggle-button',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'controlHeight',
    minWidth: 'controlHeight',
    padding: '2',
    borderRadius: 'sm',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    color: 'text.muted',
    cursor: 'pointer',
    lineHeight: 1,
    transitionFast: 'background-color, color, border-color',
    _hovered: {
      backgroundColor: 'bg.surface.3',
      color: 'text',
    },
    _selected: {
      backgroundColor: 'bg.surface.2',
      color: 'accent.emphasis',
      borderColor: 'border',
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
        transitionFast: 'color, transform, outline-color',
        _hovered: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: 'var(--toggle-icon-hover-color, token(colors.text))',
        },
        _selected: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color:
            'var(--toggle-icon-selected-color, token(colors.accent.emphasis))',
        },
        _focusVisible: {
          outline: 'focusRing',
          outlineOffset: '3px',
        },
        _disabled: {
          opacity: 0.5,
          cursor: 'default',
        },
      },
    },
  },
})
