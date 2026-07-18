import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { grid, wrap } from 'styled-system/patterns'
import type { ReactNode } from 'react'
import type { SystemStyleObject } from 'styled-system/types'
import type { HeadingLevel } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { Heading } from '@/components/ui/heading'
import { PageHeading } from '@/routes/-components/page-heading'

export const devPageSectionCss = css.raw({
  display: 'grid',
  gap: 'sectionGap',
})

export const devCardGridCss = css.raw({
  display: 'grid',
  alignItems: 'start',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(20rem, 100%), 1fr))',
  gap: '4',
})

const devSurfaceCss = css.raw({
  display: 'grid',
  gap: '4',
  padding: '5',
  border: 'default',
  borderRadius: 'lg',
  backgroundColor: 'secondary.bg',
})

const devTextStackCss = css.raw({
  display: 'grid',
  gap: '2',
  '& > p': {
    margin: 0,
  },
})

type DevPageIntroProps = {
  title: string
  description: ReactNode
  backLink?: ReactNode
  descriptionTone?: 'default' | 'muted'
}

export function DevPageIntro({
  title,
  description,
  backLink,
  descriptionTone = 'default',
}: DevPageIntroProps) {
  return (
    <header className={grid({ gap: '4' })}>
      <div
        className={wrap({
          align: 'center',
          justify: backLink ? 'space-between' : 'flex-end',
          rowGap: '2',
          columnGap: '4',
        })}
      >
        {backLink ? (
          <div className={css({ minWidth: 0 })}>{backLink}</div>
        ) : null}
        <p
          className={css({
            margin: 0,
            color: 'text.muted',
            fontSize: 'xs',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '0.35rem 0.65rem',
            border: 'default',
            borderRadius: 'full',
            backgroundColor: 'secondary.bg',
            textAlign: 'right',
          })}
        >
          Development Only
        </p>
      </div>

      <div className={css(devTextStackCss)}>
        <PageHeading>{title}</PageHeading>
        <p
          className={css(
            { maxWidth: 'readingMax' },
            descriptionTone === 'muted' && { color: 'text.muted' },
          )}
        >
          {description}
        </p>
      </div>
    </header>
  )
}

export function DevBackLink({
  to,
  children,
}: {
  to: '/dev' | '/dev/observability'
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      css={css.raw({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2',
      })}
    >
      <ArrowLeftIcon aria-hidden="true" size={18} /> {children}
    </Link>
  )
}

export function DevTitleBlock({
  title,
  description,
  headingLevel = 2,
}: {
  title: ReactNode
  description?: ReactNode
  headingLevel?: HeadingLevel
}) {
  return (
    <div className={css(devTextStackCss)}>
      <Heading level={headingLevel}>{title}</Heading>
      {description ? <p>{description}</p> : null}
    </div>
  )
}

export function DevPanel({
  as = 'section',
  css: styles,
  children,
}: {
  as?: 'article' | 'section' | 'div'
  css?: SystemStyleObject
  children: ReactNode
}) {
  const Component = as

  return (
    <Component className={css(devSurfaceCss, styles)}>{children}</Component>
  )
}

export function DevLinkCard({
  title,
  description,
  action,
}: {
  title: ReactNode
  description: ReactNode
  action: ReactNode
}) {
  return (
    <DevPanel as="article" css={css.raw({ color: 'secondary.text' })}>
      <DevTitleBlock title={title} description={description} />
      {action}
    </DevPanel>
  )
}
