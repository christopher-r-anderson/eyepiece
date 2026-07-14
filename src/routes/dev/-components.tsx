import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
  gap: '4',
})

export const devSurfaceCss = css.raw({
  display: 'grid',
  gap: '4',
  padding: '5',
  border: '1px solid token(colors.border)',
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

const devMetaRowCss = css.raw({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  rowGap: '2',
  columnGap: '4',
})

const devMetaLabelCss = css.raw({
  margin: 0,
  color: 'text.muted',
  fontSize: 'xs',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '0.35rem 0.65rem',
  border: '1px solid token(colors.border)',
  borderRadius: '999px',
  backgroundColor: 'secondary.bg',
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
    <header className={css({ display: 'grid', gap: '4' })}>
      <div
        className={css(
          devMetaRowCss,
          backLink ? undefined : { justifyContent: 'flex-end' },
        )}
      >
        {backLink ? (
          <div className={css({ minWidth: 0 })}>{backLink}</div>
        ) : null}
        <p
          className={css(devMetaLabelCss, {
            textAlign: 'right',
          })}
        >
          Development Only
        </p>
      </div>

      <div className={css(devTextStackCss)}>
        <PageHeading styles={css.raw({ margin: 0 })}>{title}</PageHeading>
        <p
          className={css(
            descriptionTone === 'muted'
              ? {
                  color: 'text.muted',
                  maxWidth: 'readingMax',
                }
              : { maxWidth: 'readingMax' },
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
      styles={css.raw({
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
      <Heading
        headingLevel={headingLevel}
        styles={css.raw({ marginBlockEnd: 0 })}
      >
        {title}
      </Heading>
      {description ? <p>{description}</p> : null}
    </div>
  )
}

export function DevPanel({
  as = 'section',
  styles,
  children,
}: {
  as?: 'article' | 'section' | 'div'
  styles?: SystemStyleObject
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
    <DevPanel as="article" styles={css.raw({ color: 'secondary.text' })}>
      <DevTitleBlock title={title} description={description} />
      {action}
    </DevPanel>
  )
}
