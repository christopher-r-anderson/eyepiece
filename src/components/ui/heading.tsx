import type { ComponentPropsWithoutRef } from 'react'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingProps = {
  headingLevel: HeadingLevel
} & ComponentPropsWithoutRef<HeadingTag>

type HeadingTag = `h${HeadingLevel}`

export function Heading({ headingLevel, ...props }: HeadingProps) {
  const Hn: HeadingTag = `h${headingLevel}`
  return <Hn {...props} />
}
