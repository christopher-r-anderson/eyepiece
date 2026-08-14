import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EyepieceApiError } from '@/lib/eyepiece-api-client/client'

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (
    error instanceof EyepieceApiError &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 429
  ) {
    return false
  }
  return failureCount < 3
}

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
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
