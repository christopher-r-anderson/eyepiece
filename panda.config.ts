import { defineConfig } from '@pandacss/dev'

// Token values mirror src/tokens.css and src/theme.css; keep them in sync
// until the Emotion removal stage of #95 deletes those files.
export default defineConfig({
  presets: ['@pandacss/preset-base'],
  preflight: false,
  include: ['./src/**/*.{ts,tsx}'],
  outdir: 'styled-system',
  utilities: {
    extend: {
      // CSS properties missing from Panda's generated property set
      viewTransitionClass: { className: 'view-transition-class' },
      WebkitBoxOrient: { className: 'webkit-box-orient' },
    },
  },
  conditions: {
    extend: {
      // react-aria-components state attributes. pressed and selected
      // intentionally replace Panda's aria-inclusive defaults: RAC sets
      // aria-pressed to reflect a ToggleButton's toggled state, so
      // [aria-pressed=true] would apply momentary-press styles to every
      // toggled-on button.
      hovered: '&[data-hovered]',
      pressed: '&[data-pressed]',
      focused: '&[data-focused]',
      selected: '&[data-selected]',
      entering: '&[data-entering]',
      exiting: '&[data-exiting]',
      // binds _dark to the app's theme mechanism (see theme-provider.tsx)
      dark: ':root[data-theme=dark] &',
      // container query breakpoints
      compactLayout: '@container (min-width: 40rem)',
      headerInline: '@container (min-width: 48rem)',
      detailSplit: '@container (min-width: 56rem)',
      searchBarInline: '@container (min-width: 34rem)',
    },
  },
  theme: {
    tokens: {
      fonts: {
        sans: {
          value:
            "'Atkinson Hyperlegible', 'Segoe UI', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', sans-serif",
        },
        mono: {
          value:
            "'Iosevka', 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        },
      },
      fontSizes: {
        xs: { value: '0.75rem' },
        sm: { value: 'clamp(0.8125rem, 0.8rem + 0.1vw, 0.875rem)' },
        base: { value: 'clamp(0.9375rem, 0.9rem + 0.25vw, 1rem)' },
        lg: { value: 'clamp(1rem, 0.95rem + 0.35vw, 1.125rem)' },
        xl: { value: 'clamp(1.25rem, 1.05rem + 1.1vw, 1.5rem)' },
        '2xl': { value: 'clamp(1.5rem, 1.15rem + 1.9vw, 2rem)' },
      },
      lineHeights: {
        tight: { value: '1.15' },
        base: { value: '1.5' },
      },
      sizes: {
        contentMax: { value: '72rem' },
        readingMax: { value: '65ch' },
        touchTargetMin: { value: '44px' },
        controlHeight: { value: 'clamp(2.25rem, 2.1rem + 0.5vw, 2.75rem)' },
      },
      spacing: {
        '1': { value: '0.25rem' },
        '2': { value: '0.5rem' },
        '3': { value: '0.75rem' },
        '4': { value: '1rem' },
        '5': { value: '1.5rem' },
        '6': { value: '2rem' },
        '7': { value: '3rem' },
        '8': { value: '4rem' },
        contentInline: { value: 'clamp(0.75rem, 2.5vw, 1.5rem)' },
        contentBlock: { value: 'clamp(1rem, 4vw, 2rem)' },
        clusterGap: { value: 'clamp(0.5rem, 1.8vw, 1rem)' },
        sectionGap: { value: 'clamp(1rem, 3vw, 2rem)' },
      },
      radii: {
        sm: { value: '0.25rem' },
        md: { value: '0.5rem' },
        lg: { value: '0.75rem' },
      },
      shadows: {
        sm: { value: '0 1px 2px rgba(0, 0, 0, 0.08)' },
        md: { value: '0 2px 8px rgba(0, 0, 0, 0.14)' },
        overlay: { value: '0 12px 28px rgba(0, 0, 0, 0.25)' },
      },
      zIndex: {
        base: { value: 0 },
        popover: { value: 10 },
        toast: { value: 20 },
        overlay: { value: 30 },
      },
      durations: {
        fast: { value: '120ms' },
        base: { value: '220ms' },
      },
      easings: {
        default: { value: 'ease' },
      },
    },
    semanticTokens: {
      colors: {
        background: {
          value: {
            base: 'oklch(0.958 0.008 286)',
            _dark: 'oklch(0.1743 0.0227 283.7998)',
          },
        },
        text: {
          DEFAULT: {
            value: {
              base: 'oklch(0.282 0.034 282)',
              _dark: 'oklch(0.9185 0.0257 285.8834)',
            },
          },
          muted: {
            value: {
              base: 'oklch(0.516 0.02 284)',
              _dark: 'oklch(0.7166 0.0462 285.1741)',
            },
          },
          accent: {
            value: {
              base: 'oklch(0.532 0.162 288)',
              _dark: 'oklch(0.7162 0.1597 290.3962)',
            },
          },
        },
        link: {
          value: {
            base: 'oklch(0.532 0.162 288)',
            _dark: 'oklch(0.7162 0.1597 290.3962)',
          },
        },
        border: {
          value: {
            base: 'oklch(0.84 0.018 286)',
            _dark: 'oklch(0.3261 0.0597 282.5832)',
          },
        },
        separator: {
          value: 'color-mix(in oklab, {colors.border} 55%, {colors.text} 45%)',
        },
        outline: {
          value: { base: 'black', _dark: 'white' },
        },
        primary: {
          bg: {
            value: {
              base: 'oklch(0.59 0.168 288)',
              _dark: 'oklch(0.7162 0.1597 290.3962)',
            },
          },
          text: {
            value: {
              base: 'oklch(1 0 0)',
              _dark: 'oklch(0.1743 0.0227 283.7998)',
            },
          },
          textMuted: {
            value: {
              base: 'oklch(0.83 0.026 286)',
              _dark: 'oklch(0.5426 0.0465 284.7435)',
            },
          },
        },
        secondary: {
          bg: {
            value: {
              base: 'oklch(0.985 0.008 286)',
              _dark: 'oklch(0.3139 0.0736 283.4591)',
            },
          },
          text: {
            value: {
              base: 'oklch(0.35 0.052 286)',
              _dark: 'oklch(0.8367 0.0849 285.9111)',
            },
          },
        },
        tertiary: {
          bg: {
            value: {
              base: 'oklch(0.944 0.016 286)',
              _dark: 'oklch(from {colors.secondary.bg} calc(l + 0.1) c h)',
            },
          },
          text: {
            value: '{colors.secondary.text}',
          },
        },
        success: {
          bg: {
            value: {
              base: 'oklch(0.9026 0.074 160.4542)',
              _dark: 'oklch(0.348 0.0778 158.0116)',
            },
          },
          text: {
            value: {
              base: 'oklch(0.396 0.1022 160.5193)',
              _dark: 'oklch(0.8775 0.0972 158.7163)',
            },
          },
        },
        warning: {
          bg: {
            value: {
              base: 'oklch(0.9369 0.1163 91.6125)',
              _dark: 'oklch(0.3702 0.0871 91.2838)',
            },
          },
          text: {
            value: {
              base: 'oklch(0.4419 0.0949 77.9333)',
              _dark: 'oklch(0.9118 0.1128 91.6432)',
            },
          },
        },
        danger: {
          bg: {
            value: {
              base: 'oklch(0.9058 0.0788 23.6895)',
              _dark: 'oklch(0.3714 0.1025 24.1384)',
            },
          },
          text: {
            value: {
              base: 'oklch(0.4487 0.1496 25.3644)',
              _dark: 'oklch(0.8842 0.1206 24.6336)',
            },
          },
        },
        info: {
          bg: {
            value: {
              base: 'oklch(0.9165 0.0628 251.7636)',
              _dark: 'oklch(0.3473 0.0893 252.1054)',
            },
          },
          text: {
            value: {
              base: 'oklch(0.4285 0.1185 253.8633)',
              _dark: 'oklch(0.8618 0.1208 252.724)',
            },
          },
        },
        assetTile: {
          bg: {
            value: {
              base: 'oklch(0.988 0.004 286)',
              _dark: 'oklch(0.25 0.045 283)',
            },
          },
          border: {
            value: {
              base: 'color-mix(in oklab, {colors.border} 72%, {colors.text} 28%)',
              _dark: 'color-mix(in oklab, {colors.border} 64%, white 12%)',
            },
          },
          captionBg: {
            value: {
              base: 'rgba(15, 21, 34, 0.74)',
              _dark: 'rgba(7, 9, 16, 0.76)',
            },
          },
          captionText: {
            value: {
              base: 'oklch(0.985 0.004 286)',
              _dark: 'oklch(0.94 0.02 286)',
            },
          },
          badgeBg: {
            value: {
              base: 'rgba(248, 249, 252, 0.9)',
              _dark: 'rgba(21, 27, 43, 0.86)',
            },
          },
          badgeText: {
            value: '{colors.text}',
          },
          badgeBorder: {
            value: {
              base: 'rgba(16, 22, 36, 0.16)',
              _dark: 'rgba(245, 247, 255, 0.12)',
            },
          },
          actionBg: {
            value: {
              base: 'rgba(248, 249, 252, 0.72)',
              _dark: 'rgba(21, 27, 43, 0.7)',
            },
          },
          actionBorder: {
            value: {
              base: 'rgba(16, 22, 36, 0.1)',
              _dark: 'rgba(245, 247, 255, 0.08)',
            },
          },
        },
        favoriteToggle: {
          idle: {
            value: '{colors.text.muted}',
          },
          hover: {
            value: {
              base: 'oklch(0.82 0.16 95)',
              _dark: 'oklch(0.84 0.16 95)',
            },
          },
          selected: {
            value: {
              base: 'oklch(0.9 0.18 96)',
              _dark: 'oklch(0.93 0.19 96)',
            },
          },
          glow: {
            value: {
              base: 'rgba(255, 214, 51, 0.34)',
              _dark: 'rgba(255, 219, 76, 0.3)',
            },
          },
        },
      },
    },
  },
})
