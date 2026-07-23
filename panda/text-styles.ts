import { defineTextStyles } from '@pandacss/dev'

// The display ladder (#129 direction; visual spec in the phase-1 converged
// mockups). Display type is always roman - italic only for a term inside
// prose. These are the only fluid sizes; UI text uses the static fontSizes.
export const textStyles = defineTextStyles({
  display: {
    // the query headline on search results
    lg: {
      value: {
        fontFamily: 'display',
        fontWeight: 400,
        fontSize: 'clamp(2.75rem, 8vw, 5rem)',
        lineHeight: 1,
      },
    },
    // the home masthead
    md: {
      value: {
        fontFamily: 'display',
        fontWeight: 400,
        fontSize: 'clamp(2.25rem, 5.5vw, 3.5rem)',
        lineHeight: 1.08,
      },
    },
    // detail-page titles
    sm: {
      value: {
        fontFamily: 'display',
        fontWeight: 400,
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        lineHeight: 1.12,
      },
    },
  },
  title: {
    // panel headings (auth card)
    lg: {
      value: {
        fontFamily: 'display',
        fontWeight: 400,
        fontSize: '1.75rem',
        lineHeight: 1.25,
      },
    },
    // section headings
    md: {
      value: {
        fontFamily: 'display',
        fontWeight: 400,
        fontSize: '1.5rem',
        lineHeight: 1.25,
      },
    },
    // card titles
    sm: {
      value: {
        fontFamily: 'display',
        fontWeight: 400,
        fontSize: '1.1875rem',
        lineHeight: 1.3,
      },
    },
  },
})
