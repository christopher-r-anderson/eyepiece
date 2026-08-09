import { defineRecipe } from '@pandacss/dev'
import {
  ghostCompactGeometry,
  ghostVisualStyles,
  touchHitAreaStyles,
} from './button.styles'

export const buttonRecipe = defineRecipe({
  className: 'button',
  // the load-more variant is prop-drilled through InfiniteLoader, which
  // jit tracking cannot see
  staticCss: [{ variant: ['text'] }],
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
      ghost: { ...ghostVisualStyles, ...ghostCompactGeometry },
      // an inline action set as prose with a hanging rule (the mockups'
      // text-btn voice)
      text: {
        backgroundColor: 'transparent',
        minHeight: 'auto',
        padding: 0,
        borderRadius: 0,
        fontWeight: 400,
        fontSize: 'control',
        color: 'text',
        borderBottom: '1px solid token(colors.border)',
        transitionFast: 'border-color, color',
        _hovered: {
          borderBottomColor: 'text',
        },
        _disabled: { color: 'text.muted' },
      },
      // composed slot recipes theme through the --button-icon-* vars; their
      // direct declarations lose by layer order (recipes beats recipes.slots)
      icon: {
        ...touchHitAreaStyles,
        width: 'controlHeightSm',
        height: 'controlHeightSm',
        flexShrink: 0,
        minHeight: 'auto',
        padding: 0,
        backgroundColor: 'transparent',
        color: 'var(--button-icon-color, token(colors.text.muted))',
        _hovered: {
          color: 'var(--button-icon-hover-color, token(colors.text))',
          backgroundColor:
            'var(--button-icon-hover-bg, token(colors.bg.surface.3))',
        },
        _disabled: { color: 'text.muted' },
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
