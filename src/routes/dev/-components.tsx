import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import type { Interpolation, Theme } from '@emotion/react'
import type { ReactNode } from 'react'
import type { HeadingLevel } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { Heading } from '@/components/ui/heading'
import { PageHeading } from '@/routes/-components/page-heading'

export const devPageSectionCss = {
  display: 'grid',
  gap: 'var(--space-section-gap)',
}

export const devCardGridCss = {
  display: 'grid',
  alignItems: 'start',
  gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
  gap: 'var(--space-4)',
}

export const devSurfaceCss = {
  display: 'grid',
  gap: 'var(--space-4)',
  padding: 'var(--space-5)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--secondary-bg)',
}

const devTextStackCss = {
  display: 'grid',
  gap: 'var(--space-2)',
  '& > p': {
    margin: 0,
  },
}

const devMetaRowCss = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--space-2) var(--space-4)',
} as const

const devMetaLabelCss = {
  margin: 0,
  color: 'var(--text-muted)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '0.35rem 0.65rem',
  border: '1px solid var(--border-color)',
  borderRadius: '999px',
  backgroundColor: 'var(--secondary-bg)',
} as const

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
    <header css={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div
        css={[
          devMetaRowCss,
          backLink ? undefined : { justifyContent: 'flex-end' },
        ]}
      >
        {backLink ? <div css={{ minWidth: 0 }}>{backLink}</div> : null}
        <p
          css={{
            ...devMetaLabelCss,
            textAlign: 'right',
          }}
        >
          Development Only
        </p>
      </div>

      <div css={devTextStackCss}>
        <PageHeading css={{ margin: 0 }}>{title}</PageHeading>
        <p
          css={
            descriptionTone === 'muted'
              ? {
                  color: 'var(--text-muted)',
                  maxWidth: 'var(--size-reading-max)',
                }
              : { maxWidth: 'var(--size-reading-max)' }
          }
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
      css={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
      }}
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
    <div css={devTextStackCss}>
      <Heading headingLevel={headingLevel} css={{ marginBlockEnd: 0 }}>
        {title}
      </Heading>
      {description ? <p>{description}</p> : null}
    </div>
  )
}

export function DevPanel({
  as = 'section',
  css,
  children,
}: {
  as?: 'article' | 'section' | 'div'
  css?: Interpolation<Theme>
  children: ReactNode
}) {
  const Component = as

  return <Component css={[devSurfaceCss, css]}>{children}</Component>
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
    <DevPanel as="article" css={{ color: 'var(--secondary-text)' }}>
      <DevTitleBlock title={title} description={description} />
      {action}
    </DevPanel>
  )
}
