import { isNotFound, isRedirect } from '@tanstack/react-router'
import * as Sentry from '@sentry/tanstackstart-react'
import { useEffect } from 'react'
import type { HeadingLevel } from '@/components/ui/heading'
import { PrettyException } from '@/components/ui/error'

export function shouldCaptureRouteError(error: unknown) {
  if (isRedirect(error) || isNotFound(error)) {
    return false
  }

  if (error instanceof Response) {
    return error.status >= 500 || error.status < 400
  }

  if (error && typeof error === 'object') {
    const status =
      'status' in error && typeof error.status === 'number'
        ? error.status
        : undefined
    const statusCode =
      'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : undefined
    const routerCode =
      'routerCode' in error && typeof error.routerCode === 'string'
        ? error.routerCode
        : undefined

    if (routerCode === 'VALIDATE_SEARCH') {
      return false
    }

    if (
      (status !== undefined && status >= 400 && status < 500) ||
      (statusCode !== undefined && statusCode >= 400 && statusCode < 500)
    ) {
      return false
    }
  }

  return true
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
