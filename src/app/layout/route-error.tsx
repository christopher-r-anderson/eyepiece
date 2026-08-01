import { css } from 'styled-system/css'
import type { RouteErrorCaptureContext } from '@/components/errors/error-capture'
import { useCaptureRouteError } from '@/components/errors/error-capture'
import { PrettyException } from '@/components/errors/pretty-exception'

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
      <p className={css({ color: 'text.muted', maxWidth: 'readingMax' })}>
        {message}
      </p>
      <PrettyException error={error} headingLevel={2} />
    </>
  )
}
