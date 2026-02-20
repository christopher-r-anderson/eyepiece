import type { ReactNode } from 'react'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

type HeadingProps = {
  headingLevel: HeadingLevel
  children: ReactNode
}

type HeadingTag = `h${HeadingLevel}`

export function Heading({ headingLevel, children }: HeadingProps) {
  const Hn: HeadingTag = `h${headingLevel}`
  return <Hn>{children}</Hn>
}
