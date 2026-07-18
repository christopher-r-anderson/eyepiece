import { css, cx } from 'styled-system/css'
import { heading } from 'styled-system/recipes'
import type { ComponentPropsWithoutRef } from 'react'
import type { UiProps } from './style-contract'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingProps = {
  level: HeadingLevel
} & UiProps<ComponentPropsWithoutRef<HeadingTag>>

type HeadingTag = `h${HeadingLevel}`

export function Heading({
  level,
  css: cssProp,
  className,
  ...props
}: HeadingProps) {
  const Hn: HeadingTag = `h${level}`

  return (
    <Hn
      {...props}
      className={cx(
        // the recipe's variant keys are strings
        heading({ level: `${level}` }),
        css(cssProp),
        className,
      )}
    />
  )
}
