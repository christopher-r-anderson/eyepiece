interface ThemeColors {
  '--background': string
  '--text': string
  '--text-muted': string
  '--text-accent': string
  '--border-color': string
  '--outline-color': string
  '--primary-bg': string
  '--primary-text': string
  '--primary-text-muted': string
  '--secondary-bg': string
  '--secondary-text': string
  '--tertiary-bg': string
  '--tertiary-text': string
}

export interface Theme {
  colors: ThemeColors
}

export const lightTheme: Theme = {
  colors: {
    '--background': 'oklch(0.9730 0.0133 286.1503)',
    '--text': 'oklch(0.3015 0.0572 282.4176)',
    '--text-muted': 'oklch(0.5426 0.0465 284.7435)',
    '--text-accent': 'oklch(0.5417 0.1790 288.0332)',
    '--border-color': 'oklch(0.9115 0.0216 285.9625)',
    '--outline-color': 'black',
    '--primary-bg': 'oklch(0.5417 0.1790 288.0332)',
    '--primary-text': 'oklch(1.0000 0 0)',
    '--primary-text-muted': 'oklch(0.7166 0.0462 285.1741)',
    '--secondary-bg': 'oklch(0.9174 0.0435 292.6901)',
    '--secondary-text': 'oklch(0.4143 0.1039 288.1742)',
    '--tertiary-bg': 'oklch(from var(--secondary-bg) calc(l + 0.1) c h)',
    '--tertiary-text': 'var(--secondary-text)',
  },
}

export const darkTheme: Theme = {
  colors: {
    '--background': 'oklch(0.1743 0.0227 283.7998)',
    '--text': 'oklch(0.9185 0.0257 285.8834)',
    '--text-muted': 'oklch(0.7166 0.0462 285.1741)',
    '--text-accent': 'oklch(0.7162 0.1597 290.3962)',
    '--border-color': 'oklch(0.3261 0.0597 282.5832)',
    '--outline-color': 'white',
    '--primary-bg': 'oklch(0.7162 0.1597 290.3962)',
    '--primary-text': 'oklch(0.1743 0.0227 283.7998)',
    '--primary-text-muted': 'oklch(0.5426 0.0465 284.7435)',
    '--secondary-bg': 'oklch(0.3139 0.0736 283.4591)',
    '--secondary-text': 'oklch(0.8367 0.0849 285.9111)',
    '--tertiary-bg': 'oklch(from var(--secondary-bg) calc(l + 0.1) c h)',
    '--tertiary-text': 'var(--secondary-text)',
  },
}
