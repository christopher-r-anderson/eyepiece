import { css, cx } from 'styled-system/css'
import { heading } from 'styled-system/recipes'
import type { ComponentPropsWithoutRef } from 'react'
import type { StyleProps } from './style-props'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingProps = {
  headingLevel: HeadingLevel
} & StyleProps &
  ComponentPropsWithoutRef<HeadingTag>

type HeadingTag = `h${HeadingLevel}`

export function Heading({
  headingLevel,
  css: cssProp,
  ...props
}: HeadingProps) {
  const Hn: HeadingTag = `h${headingLevel}`

  return (
    <Hn
      {...props}
      className={cx(heading({ level: `${headingLevel}` }), css(cssProp))}
    />
  )
}
