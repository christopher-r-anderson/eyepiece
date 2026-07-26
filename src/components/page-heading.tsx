import { css } from 'styled-system/css'
import type { HeadingLevel, HeadingProps } from '@/components/ui/heading'
import { Heading } from '@/components/ui/heading'

type PageHeadingProps = Omit<HeadingProps, 'level'> & {
  level?: HeadingLevel
}

const pageHeadingStyles = css.raw({
  color: 'accent.emphasis',
  fontSize: 'clamp(token(fontSizes.2xl), 4vw, 2.5rem)',
  fontWeight: 'bold',
  lineHeight: 'tight',
})

export function PageHeading({ css: styles, ...props }: PageHeadingProps) {
  return (
    <Heading css={css.raw(pageHeadingStyles, styles)} level={1} {...props} />
  )
}
