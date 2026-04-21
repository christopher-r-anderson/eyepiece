import * as Sentry from '@sentry/tanstackstart-react'
import { useEffect, useMemo } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { shouldReportError } from '../../lib/error-observability'
import type { HeadingLevel } from '@/components/ui/heading'
import { PrettyException } from '@/components/ui/error'

export type RouteErrorCaptureContext = {
  boundaryKind?: 'route' | 'catch' | 'root-route'
  feature?: string
  providerId?: string
  operation?: string
  routePath?: string
}

export type RouteErrorSentryMetadata = {
  tags: Record<string, string>
  context?: Record<string, string>
}

export function shouldCaptureRouteError(error: unknown) {
  return shouldReportError(error)
}

export function getRouteErrorSentryMetadata({
  pathname,
  captureContext,
}: {
  pathname?: string
  captureContext?: RouteErrorCaptureContext
}): RouteErrorSentryMetadata {
  const routePath = captureContext?.routePath ?? pathname
  const tags = {
    ...(captureContext?.boundaryKind
      ? { boundary_kind: captureContext.boundaryKind }
      : {}),
    ...(captureContext?.feature ? { feature: captureContext.feature } : {}),
    ...(captureContext?.providerId
      ? { provider_id: captureContext.providerId }
      : {}),
    ...(captureContext?.operation
      ? { operation: captureContext.operation }
      : {}),
  }

  const context = {
    ...(routePath ? { routePath } : {}),
    ...(captureContext?.boundaryKind
      ? { boundaryKind: captureContext.boundaryKind }
      : {}),
    ...(captureContext?.feature ? { feature: captureContext.feature } : {}),
    ...(captureContext?.providerId
      ? { providerId: captureContext.providerId }
      : {}),
    ...(captureContext?.operation
      ? { operation: captureContext.operation }
      : {}),
  }

  return {
    tags,
    context: Object.keys(context).length > 0 ? context : undefined,
  }
}

export function useCaptureRouteError(
  error: unknown,
  captureContext?: RouteErrorCaptureContext,
) {
  const pathname = useRouterState({
    select: (state) =>
      state.resolvedLocation?.pathname ?? state.location.pathname,
  })
  const metadata = useMemo(
    () =>
      getRouteErrorSentryMetadata({
        pathname,
        captureContext,
      }),
    [
      captureContext?.boundaryKind,
      captureContext?.feature,
      captureContext?.operation,
      captureContext?.providerId,
      captureContext?.routePath,
      pathname,
    ],
  )

  useEffect(() => {
    if (!shouldCaptureRouteError(error)) {
      return
    }

    Sentry.withScope((scope) => {
      for (const [key, value] of Object.entries(metadata.tags)) {
        scope.setTag(key, value)
      }

      if (metadata.context) {
        scope.setContext('route_error', metadata.context)
      }

      Sentry.captureException(error)
    })
  }, [
    captureContext?.boundaryKind,
    captureContext?.feature,
    captureContext?.operation,
    captureContext?.providerId,
    captureContext?.routePath,
    error,
    metadata.context,
    metadata.tags,
    pathname,
  ])
}

export function RouteError({
  error,
  heading,
  message,
  captureContext,
}: {
  error: unknown
  heading: React.ReactNode
  message: React.ReactNode
  captureContext?: RouteErrorCaptureContext
}) {
  useCaptureRouteError(error, captureContext)

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
  captureContext,
}: {
  error: unknown
  headingLevel: HeadingLevel
  captureContext?: RouteErrorCaptureContext
}) {
  useCaptureRouteError(error, captureContext)

  return <PrettyException error={error} headingLevel={headingLevel} />
}

export function CapturedAlertError({
  error,
  message,
  captureContext,
}: {
  error: unknown
  message: React.ReactNode
  captureContext?: RouteErrorCaptureContext
}) {
  useCaptureRouteError(error, captureContext)

  return <p role="alert">{message}</p>
}
