import type { Interpolation, Theme } from '@emotion/react'
import type { ComponentPropsWithoutRef } from 'react'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingProps = {
  headingLevel: HeadingLevel
  css?: Interpolation<Theme>
} & ComponentPropsWithoutRef<HeadingTag>

type HeadingTag = `h${HeadingLevel}`

const baseHeadingCss = {
  margin: 0,
  color: 'inherit',
  fontFamily: 'inherit',
  fontWeight: 700,
  lineHeight: 'var(--line-height-tight)',
}

const headingLevelCss: Record<HeadingLevel, Interpolation<Theme>> = {
  1: {
    fontSize: 'var(--text-2xl)',
    marginBlockEnd: 'var(--space-5)',
  },
  2: {
    fontSize: 'var(--text-xl)',
    marginBlockEnd: 'var(--space-4)',
  },
  3: {
    fontSize: 'var(--text-lg)',
    marginBlockEnd: 'var(--space-3)',
  },
  4: {
    fontSize: 'var(--text-base)',
    marginBlockEnd: 'var(--space-3)',
  },
  5: {
    fontSize: 'var(--text-sm)',
    marginBlockEnd: 'var(--space-2)',
  },
  6: {
    fontSize: 'var(--text-xs)',
    marginBlockEnd: 'var(--space-2)',
  },
}

export function Heading({ headingLevel, css, ...props }: HeadingProps) {
  const Hn: HeadingTag = `h${headingLevel}`

  return (
    <Hn {...props} css={[baseHeadingCss, headingLevelCss[headingLevel], css]} />
  )
}
