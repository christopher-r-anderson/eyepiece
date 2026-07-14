import { css } from 'styled-system/css'
import type { HeadingProps } from '@/components/ui/heading'
import { Heading } from '@/components/ui/heading'

type PageHeadingProps = Omit<HeadingProps, 'headingLevel'> &
  Partial<Pick<HeadingProps, 'headingLevel'>>

const pageHeadingStyles = css.raw({
  color: 'text.accent',
  fontSize: 'clamp(token(fontSizes.2xl), 4vw, 2.5rem)',
  fontWeight: 'bold',
  lineHeight: 'tight',
  // shorthand so caller margin overrides win the css() merge
  margin: 'token(spacing.4) 0 token(spacing.6)',
  padding: 0,
  alignSelf: 'flex-start',
})

export function PageHeading({ css: styles, ...props }: PageHeadingProps) {
  return (
    <Heading
      css={css.raw(pageHeadingStyles, styles)}
      headingLevel={1}
      {...props}
    />
  )
}
