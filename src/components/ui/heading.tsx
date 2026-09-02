import { css, cx } from 'styled-system/css'
import { heading } from 'styled-system/recipes'
import type { ComponentPropsWithoutRef } from 'react'
import type { UiProps } from './style-contract'

// nothing renders past 3 (the deepest computed level is titleLevel === 1 ? 2 : 3);
// widen alongside the recipe if deeper sections ever exist
export type HeadingLevel = 1 | 2 | 3

type HeadingSize = 'title-lg' | 'title-md' | 'display-md'

export type HeadingProps = {
  level: HeadingLevel
  size?: HeadingSize
} & UiProps<ComponentPropsWithoutRef<HeadingTag>>

type HeadingTag = `h${HeadingLevel}`

export function Heading({
  level,
  size,
  css: cssProp,
  className,
  ...props
}: HeadingProps) {
  const Hn: HeadingTag = `h${level}`

  return (
    <Hn
      {...props}
      className={cx(
        // the recipe's variant keys are strings; size owns the scale when
        // set, so the level variant is skipped to avoid a same-layer race
        heading({ level: size ? undefined : `${level}`, size }),
        css(cssProp),
        className,
      )}
    />
  )
}
