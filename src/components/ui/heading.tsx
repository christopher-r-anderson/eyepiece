import { css, cx } from 'styled-system/css'
import type { ComponentPropsWithoutRef } from 'react'
import type { SystemStyleObject } from 'styled-system/types'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingProps = {
  headingLevel: HeadingLevel
  css?: SystemStyleObject
  className?: string
} & ComponentPropsWithoutRef<HeadingTag>

type HeadingTag = `h${HeadingLevel}`

const baseHeadingStyles = css.raw({
  margin: 0,
  color: 'inherit',
  fontFamily: 'inherit',
  fontWeight: 700,
  lineHeight: 'tight',
})

const headingLevelStyles: Record<HeadingLevel, SystemStyleObject> = {
  1: css.raw({
    fontSize: '2xl',
    marginBlockEnd: '5',
  }),
  2: css.raw({
    fontSize: 'xl',
    marginBlockEnd: '4',
  }),
  3: css.raw({
    fontSize: 'lg',
    marginBlockEnd: '3',
  }),
  4: css.raw({
    fontSize: 'base',
    marginBlockEnd: '3',
  }),
  5: css.raw({
    fontSize: 'sm',
    marginBlockEnd: '2',
  }),
  6: css.raw({
    fontSize: 'xs',
    marginBlockEnd: '2',
  }),
}

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
        css(baseHeadingStyles, headingLevelStyles[headingLevel], cssProp),
        className,
      )}
    />
  )
}
