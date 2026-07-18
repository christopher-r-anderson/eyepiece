import { css } from 'styled-system/css'
import type { HeadingLevel, HeadingProps } from '@/components/ui/heading'
import { Heading } from '@/components/ui/heading'

type PageHeadingProps = Omit<HeadingProps, 'level'> & {
  level?: HeadingLevel
}

const pageHeadingStyles = css.raw({
  color: 'text.accent',
  fontSize: 'clamp(token(fontSizes.2xl), 4vw, 2.5rem)',
  fontWeight: 'bold',
  lineHeight: 'tight',
  marginTop: '4',
  marginInline: 0,
  marginBlockEnd: '6',
  padding: 0,
  alignSelf: 'flex-start',
})

export function PageHeading({ css: styles, ...props }: PageHeadingProps) {
  return (
    <Heading css={css.raw(pageHeadingStyles, styles)} level={1} {...props} />
  )
}
