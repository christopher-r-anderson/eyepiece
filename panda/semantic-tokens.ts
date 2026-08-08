import { defineSemanticTokens } from '@pandacss/dev'

// The "violet atlas" palette (#129 decision record; visual spec in the phase-1
// baselines dir). Dark is the design-primary theme. The surface ladder
// expresses elevation by lightening in both themes: dark raises out of the
// deep canvas, light raises toward white off a violet-gray field. The warm
// "star" accent is reserved for favorite stars and focus rings.
//
// State colors are explicit tokens - no mixing math in token values or
// component styles. Every text/background pair here is contrast-checked (the
// table lives in the phase-2 palette PR).
export const semanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      canvas: {
        value: {
          base: 'oklch(0.93 0.012 293)',
          _dark: 'oklch(0.1896 0.0202 293.5)',
        },
      },
      surface: {
        '1': {
          value: {
            base: 'oklch(0.955 0.009 293)',
            _dark: 'oklch(0.2243 0.0291 293.1)',
          },
        },
        '2': {
          value: {
            base: 'oklch(0.975 0.006 293)',
            _dark: 'oklch(0.266 0.0371 292.9)',
          },
        },
        '3': {
          value: {
            base: 'oklch(0.99 0.004 293)',
            _dark: 'oklch(0.3061 0.0447 292.7)',
          },
        },
        '4': {
          value: {
            base: 'oklch(0.998 0.002 293)',
            _dark: 'oklch(0.3483 0.0503 293.1)',
          },
        },
      },
    },
    text: {
      DEFAULT: {
        value: {
          base: 'oklch(0.26 0.035 293)',
          _dark: 'oklch(0.9428 0.0163 297.5)',
        },
      },
      muted: {
        value: {
          base: 'oklch(0.46 0.03 294)',
          _dark: 'oklch(0.6814 0.0488 296.2)',
        },
      },
    },
    accent: {
      DEFAULT: {
        value: {
          base: 'oklch(0.45 0.13 293)',
          _dark: 'oklch(0.6327 0.1058 293.5)',
        },
      },
      // holds AA for text on raised surfaces, where plain accent does not
      emphasis: {
        value: {
          base: 'oklch(0.39 0.125 293)',
          _dark: 'oklch(0.7278 0.0939 293.1)',
        },
      },
      fg: {
        DEFAULT: {
          value: {
            base: 'oklch(0.985 0.005 293)',
            _dark: 'oklch(0.1896 0.0202 293.5)',
          },
        },
        // disabled text on the accent fill
        muted: {
          value: {
            base: 'oklch(0.88 0.03 293)',
            _dark: 'oklch(0.34 0.035 293)',
          },
        },
      },
    },
    star: {
      value: {
        base: 'oklch(0.46 0.095 80)',
        _dark: 'oklch(0.8243 0.0879 80.9)',
      },
    },
    border: {
      value: {
        base: 'oklch(0.86 0.02 293)',
        _dark: 'oklch(0.33 0.045 293)',
      },
    },
    separator: {
      value: {
        base: 'oklch(0.55 0.03 293)',
        _dark: 'oklch(0.55 0.045 293)',
      },
    },
    control: {
      // >=3:1 against both the control fill (surface 2) and the canvas, so
      // the input boundary stays visible (WCAG 1.4.11)
      border: {
        value: {
          base: 'oklch(0.57 0.03 293)',
          _dark: 'oklch(0.55 0.05 293)',
        },
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
        value: '{colors.bg.surface.1}',
      },
      // the veil scrim composites over arbitrary imagery - its text and icon
      // pairs are contrast-checked against worst-case composites, not the
      // raw token value
      captionBg: {
        value: {
          base: 'rgba(242, 241, 247, 0.88)',
          _dark: 'rgba(12, 10, 20, 0.76)',
        },
      },
      captionText: {
        value: {
          base: 'oklch(0.26 0.035 293)',
          _dark: 'oklch(0.9428 0.0163 297.5)',
        },
      },
    },
  },
  sizes: {
    // every control rides this (button, toggle, fields, switch), and
    // controlHeightSm derives from it in tokens.ts. The clamp scales with
    // viewport for pointer density; a coarse primary pointer gets the
    // touch floor instead - touch guidance keys on the pointer, not the
    // screen size. Semantic rather than plain token: the conditional
    // value must emit in the tokens layer, where a globalCss override
    // (base layer) would lose
    controlHeight: {
      value: {
        base: 'clamp(2.25rem, 2.1rem + 0.5vw, 2.75rem)',
        _coarsePointer: '{sizes.touchTargetMin}',
      },
    },
  },
})
