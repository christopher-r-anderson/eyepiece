import { css } from 'styled-system/css'
import type { HeadingProps } from '@/components/ui/heading'
import { Heading } from '@/components/ui/heading'

type PageHeadingProps = Omit<HeadingProps, 'headingLevel'> &
  Partial<Pick<HeadingProps, 'headingLevel'>>

export function PageHeading(props: PageHeadingProps) {
  return (
    <Heading
      styles={css.raw({
        color: 'text.accent',
        fontSize: 'clamp(token(fontSizes.2xl), 4vw, 2.5rem)',
        fontWeight: 'bold',
        lineHeight: 'tight',
        marginTop: '4',
        marginInline: 0,
        marginBottom: '6',
        padding: 0,
        alignSelf: 'flex-start',
      })}
      headingLevel={1}
      {...props}
    />
  )
}
