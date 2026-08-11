import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import type { ReactNode } from 'react'
import type { SystemStyleObject } from 'styled-system/types'
import type { HeadingLevel } from '@/components/ui/heading'
import { panelSurfaceStyles } from '@/components/ui/surface.styles'
import { Link } from '@/components/ui/link'
import { Heading } from '@/components/ui/heading'
import { PageHeader } from '@/components/page-header'

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
  ...panelSurfaceStyles,
})

const devTextStackCss = css.raw({
  display: 'grid',
  gap: '2',
})

type DevPageIntroProps = {
  title: string
  description: ReactNode
  backLink?: ReactNode
}

export function DevPageIntro({
  title,
  description,
  backLink,
}: DevPageIntroProps) {
  return (
    <header className={grid({ gap: '4' })}>
      {backLink ? <div className={css({ minWidth: 0 })}>{backLink}</div> : null}
      <div className={css(devTextStackCss)}>
        <PageHeader title={title} meta="development only" />
        <p className={css({ maxWidth: 'readingMax', color: 'text.muted' })}>
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
        gap: '2',
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
    <DevPanel as="article" css={{ color: 'text' }}>
      <DevTitleBlock title={title} description={description} />
      {action}
    </DevPanel>
  )
}
