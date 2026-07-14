import { css, cva, cx } from 'styled-system/css'
import type { ComponentPropsWithoutRef } from 'react'
import type { StyleProps } from './style-props'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingProps = {
  headingLevel: HeadingLevel
} & StyleProps &
  ComponentPropsWithoutRef<HeadingTag>

type HeadingTag = `h${HeadingLevel}`

const heading = cva({
  base: {
    margin: 0,
    color: 'inherit',
    fontFamily: 'inherit',
    fontWeight: 700,
    lineHeight: 'tight',
  },
  variants: {
    level: {
      1: { fontSize: '2xl', marginBlockEnd: '5' },
      2: { fontSize: 'xl', marginBlockEnd: '4' },
      3: { fontSize: 'lg', marginBlockEnd: '3' },
      4: { fontSize: 'base', marginBlockEnd: '3' },
      5: { fontSize: 'sm', marginBlockEnd: '2' },
      6: { fontSize: 'xs', marginBlockEnd: '2' },
    },
  },
})

export function Heading({
  headingLevel,
  css: cssProp,
  className,
  ...props
}: HeadingProps) {
  const Hn: HeadingTag = `h${headingLevel}`

  return (
    <Hn
      {...props}
      className={cx(
        css(heading.raw({ level: headingLevel }), cssProp),
        className,
      )}
    />
  )
}
