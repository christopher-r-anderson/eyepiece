import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EyepieceApiError } from '@/lib/eyepiece-api-client/client'

// 4xx is deterministic here - even 429, whose provider quotas reset hourly,
// far past any backoff
export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (
    error instanceof EyepieceApiError &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return false
  }
  return failureCount < 3
}

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // SSR fails fast into route boundaries; the default backoff ladder
        // would run inside TTFB and multiply loopback requests per miss
        retry: import.meta.env.SSR ? false : shouldRetryQuery,
      },
    },
  })
  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
