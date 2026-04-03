import type { ErrorComponentProps } from '@tanstack/react-router'
import { PrettyException } from '@/components/ui/error'
import { useCaptureRouteError } from '@/app/layout/route-error'

export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  useCaptureRouteError(error)

  return (
    <div>
      <h1>Something went wrong</h1>

      <PrettyException error={error} headingLevel={2} />

      <button onClick={reset}>Try again</button>
    </div>
  )
}
