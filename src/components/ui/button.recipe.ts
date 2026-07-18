import { defineRecipe } from '@pandacss/dev'
import { ghostVisualStyles } from './button.styles'

export const buttonRecipe = defineRecipe({
  className: 'button',
  base: {
    border: 'none',
    minHeight: 'controlHeight',
    padding: 'token(spacing.2) token(spacing.4)',
    borderRadius: 'md',
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
        backgroundColor: 'primary.bg',
        color: 'primary.text',
        _disabled: { color: 'primary.textMuted' },
      },
      secondary: {
        border: 'control',
        backgroundColor: 'secondary.bg',
        color: 'secondary.text',
        _hovered: {
          backgroundColor:
            'color-mix(in oklab, token(colors.secondary.bg) 72%, token(colors.tertiary.bg) 28%)',
        },
        _disabled: { color: 'primary.textMuted' },
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
