import type { ReactNode } from 'react'

export type HeadingLevel = 1 | 2 | 3
type AuthFormHeadingProps = {
  headingLevel: HeadingLevel
  id?: string
  children: ReactNode
}
type HeadingTag = `h${HeadingLevel}`

export function AuthFormHeading({
  headingLevel,
  id,
  children,
}: AuthFormHeadingProps) {
  const Heading: HeadingTag = `h${headingLevel}`
  return (
    <Heading
      id={id}
      css={{ fontSize: '1.25rem', margin: 0, marginBlockEnd: '2rem' }}
    >
      {children}
    </Heading>
  )
}
