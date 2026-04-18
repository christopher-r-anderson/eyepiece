import * as Sentry from '@sentry/tanstackstart-react'
import { useEffect } from 'react'
import { shouldReportError } from '../../lib/error-observability'
import type { HeadingLevel } from '@/components/ui/heading'
import { PrettyException } from '@/components/ui/error'

export function shouldCaptureRouteError(error: unknown) {
  return shouldReportError(error)
}

export function useCaptureRouteError(error: unknown) {
  useEffect(() => {
    if (!shouldCaptureRouteError(error)) {
      return
    }

    Sentry.captureException(error)
  }, [error])
}

export function RouteError({
  error,
  heading,
  message,
}: {
  error: unknown
  heading: React.ReactNode
  message: React.ReactNode
}) {
  useCaptureRouteError(error)

  return (
    <>
      {heading}
      <p>{message}</p>
      <PrettyException error={error} headingLevel={2} />
    </>
  )
}

export function CapturedPrettyError({
  error,
  headingLevel,
}: {
  error: unknown
  headingLevel: HeadingLevel
}) {
  useCaptureRouteError(error)

  return <PrettyException error={error} headingLevel={headingLevel} />
}

export function CapturedAlertError({
  error,
  message,
}: {
  error: unknown
  message: React.ReactNode
}) {
  useCaptureRouteError(error)

  return <p role="alert">{message}</p>
}
