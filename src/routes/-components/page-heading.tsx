import type { HeadingProps } from '@/components/ui/heading'
import { Heading } from '@/components/ui/heading'

type PageHeadingProps = Omit<HeadingProps, 'headingLevel'> &
  Partial<Pick<HeadingProps, 'headingLevel'>>

export function PageHeading(props: PageHeadingProps) {
  return (
    <Heading
      css={{
        color: 'var(--text-accent)',
        fontSize: '2rem',
        fontWeight: 'bold',
        margin: '1rem 0 2rem',
        padding: 0,
        alignSelf: 'flex-start',
      }}
      headingLevel={1}
      {...props}
    />
  )
}
