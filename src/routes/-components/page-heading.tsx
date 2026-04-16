import type { HeadingProps } from '@/components/ui/heading'
import { Heading } from '@/components/ui/heading'

type PageHeadingProps = Omit<HeadingProps, 'headingLevel'> &
  Partial<Pick<HeadingProps, 'headingLevel'>>

export function PageHeading(props: PageHeadingProps) {
  return (
    <Heading
      css={{
        color: 'var(--text-accent)',
        fontSize: 'clamp(var(--text-2xl), 4vw, 2.5rem)',
        fontWeight: 'bold',
        lineHeight: 'var(--line-height-tight)',
        margin: 'var(--space-4) 0 var(--space-6)',
        padding: 0,
        alignSelf: 'flex-start',
      }}
      headingLevel={1}
      {...props}
    />
  )
}
