import { css, cx } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import type { HeadingLevel } from '@/components/ui/heading'
import { Heading } from '@/components/ui/heading'
import { panelSurfaceStyles } from '@/components/ui/surface.styles'

const exceptionStackCss = grid({
  gap: '3',
  justifyItems: 'start',
})

const detailsPanelCss = cx(
  css(panelSurfaceStyles),
  css({
    justifySelf: 'stretch',
    textStyle: 'meta',
    '& dt': { textTransform: 'lowercase', color: 'text.muted' },
    '& dd': { paddingInlineStart: '3' },
    '& dd + dt': { marginTop: '2' },
    '& pre': { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  }),
)

const SHOW_EXCEPTION_DETAILS = import.meta.env.DEV

function getErrorCode(error: Error) {
  if ('code' in error && typeof error.code === 'string') {
    return error.code
  }

  return undefined
}

export function getPrettyExceptionDisplay(
  error: unknown,
  options?: { showDetails?: boolean },
) {
  const showDetails = options?.showDetails ?? SHOW_EXCEPTION_DETAILS

  if (!(error instanceof Error)) {
    return {
      title: 'Unknown error',
      message: 'An unexpected error occurred.',
      name: undefined,
      code: undefined,
      cause: undefined,
      showDetails: false,
    }
  }

  if (!showDetails) {
    return {
      title: 'Error',
      message: 'An unexpected error occurred.',
      name: undefined,
      code: undefined,
      cause: undefined,
      showDetails: false,
    }
  }

  return {
    title: 'Error',
    message: error.message || 'An unexpected error occurred.',
    name: error.name || undefined,
    code: getErrorCode(error),
    cause: error.cause,
    showDetails: true,
  }
}

function PrettyErrorDetails({ error }: { error: unknown }) {
  const display = getPrettyExceptionDisplay(error)

  return (
    <dl>
      {display.name && (
        <>
          <dt>Name</dt>
          <dd>
            <pre>{display.name}</pre>
          </dd>
        </>
      )}
      {display.code && (
        <>
          <dt>Code</dt>
          <dd>
            <pre>{display.code}</pre>
          </dd>
        </>
      )}
      {display.message && (
        <>
          <dt>Message</dt>
          <dd>
            <pre>{display.message}</pre>
          </dd>
        </>
      )}
      {display.cause != null && (
        <>
          <dt>Cause</dt>
          <dd>
            <PrettyErrorDetails error={display.cause} />
          </dd>
        </>
      )}
    </dl>
  )
}

export function PrettyException({
  error,
  headingLevel,
}: {
  error: unknown
  headingLevel: HeadingLevel
}) {
  const display = getPrettyExceptionDisplay(error)

  return (
    <div className={exceptionStackCss}>
      <Heading level={headingLevel} size="title-md">
        {display.title}
      </Heading>
      {display.showDetails ? (
        <div className={detailsPanelCss}>
          <PrettyErrorDetails error={error} />
        </div>
      ) : (
        <p className={css({ color: 'text.muted', maxWidth: 'readingMax' })}>
          {display.message}
        </p>
      )}
    </div>
  )
}
