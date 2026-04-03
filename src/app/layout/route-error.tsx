import * as Sentry from '@sentry/tanstackstart-react'
import { useEffect } from 'react'
import { PrettyException } from '@/components/ui/error'

export function useCaptureRouteError(error: unknown) {
  useEffect(() => {
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
