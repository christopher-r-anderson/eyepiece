import { defineRecipe } from '@pandacss/dev'

export const buttonRecipe = defineRecipe({
  className: 'button',
  // wrappers forward variant props at runtime, invisible to jit tracking
  staticCss: ['*'],
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
        border:
          '1px solid color-mix(in oklab, token(colors.border) 88%, token(colors.text) 12%)',
        backgroundColor: 'secondary.bg',
        color: 'secondary.text',
        _hovered: {
          backgroundColor:
            'color-mix(in oklab, token(colors.secondary.bg) 72%, token(colors.tertiary.bg) 28%)',
        },
        _disabled: { color: 'primary.textMuted' },
      },
      ghost: {
        border: '1px solid transparent',
        backgroundColor: 'transparent',
        color: 'primary.textMuted',
        _hovered: {
          color: 'text',
          border:
            '1px solid color-mix(in oklab, token(colors.border) 88%, token(colors.text) 12%)',
          backgroundColor:
            'color-mix(in oklab, token(colors.tertiary.bg) 72%, token(colors.background) 28%)',
        },
      },
      bare: {
        backgroundColor: 'transparent',
        minHeight: 'auto',
        padding: 0,
        fontSize: '1em',
      },
    },
  },
  defaultVariants: {
    variant: 'secondary',
  },
})
