import { CatchBoundary } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { useCaptureRouteError } from './error-capture'
import { PrettyException } from './pretty-exception'
import type { ReactNode } from 'react'
import type { RouteErrorCaptureContext } from './error-capture'
import type { HeadingLevel } from '@/components/ui/heading'

export function CapturedPrettyError({
  error,
  headingLevel,
  captureContext,
}: {
  error: unknown
  headingLevel: HeadingLevel
  captureContext?: RouteErrorCaptureContext
}) {
  useCaptureRouteError(error, captureContext)

  return <PrettyException error={error} headingLevel={headingLevel} />
}

function CapturedAlertError({
  error,
  message,
  captureContext,
}: {
  error: unknown
  message: ReactNode
  captureContext?: RouteErrorCaptureContext
}) {
  useCaptureRouteError(error, captureContext)

  return (
    <p
      role="alert"
      className={css({ color: 'text.muted', maxWidth: 'readingMax' })}
    >
      {message}
    </p>
  )
}

export function CapturedCatchBoundary({
  resetKey,
  message,
  captureContext,
  children,
}: {
  resetKey: string
  message: ReactNode
  captureContext?: RouteErrorCaptureContext
  children: ReactNode
}) {
  return (
    <CatchBoundary
      getResetKey={() => resetKey}
      errorComponent={({ error }) => (
        <CapturedAlertError
          error={error}
          message={message}
          captureContext={captureContext}
        />
      )}
    >
      {children}
    </CatchBoundary>
  )
}
