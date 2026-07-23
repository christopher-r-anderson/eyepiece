import { defineRecipe } from '@pandacss/dev'
import { ghostVisualStyles } from './button.styles'

export const buttonRecipe = defineRecipe({
  className: 'button',
  base: {
    border: 'none',
    minHeight: 'controlHeight',
    padding: 'token(spacing.2) token(spacing.4)',
    borderRadius: 'sm',
    fontSize: 'base',
    fontWeight: 600,
    lineHeight: 'tight',
    gap: '2',
    cursor: 'pointer',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    transitionFast: 'background-color, color, transform',
    _focused: {
      outline: 'none',
    },
    _focusVisible: {
      outline: 'focusRing',
      outlineOffset: '2px',
    },
    _pressed: {
      transform: 'translateY(1px)',
    },
    _disabled: {
      cursor: 'default',
      opacity: 0.7,
    },
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: 'accent',
        color: 'accent.fg',
        _disabled: { color: 'accent.fg.muted' },
      },
      secondary: {
        border: 'control',
        backgroundColor: 'bg.surface.2',
        color: 'text',
        _hovered: {
          backgroundColor: 'bg.surface.3',
        },
        _disabled: { color: 'text.muted' },
      },
      ghost: ghostVisualStyles,
      bare: {
        backgroundColor: 'transparent',
        minHeight: 'auto',
        padding: 0,
        fontSize: '1em',
      },
    },
    size: {
      // square hit area for icon-only content; composes with any variant
      icon: {
        minWidth: 'controlHeightSm',
        minHeight: 'controlHeightSm',
        padding: '2',
      },
    },
  },
  defaultVariants: {
    variant: 'secondary',
  },
})
