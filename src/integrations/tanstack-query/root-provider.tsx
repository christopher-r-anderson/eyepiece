import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type {
  DefaultError,
  FetchQueryOptions,
  QueryKey,
} from '@tanstack/react-query'
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

// fetchQuery - and everything that funnels through it: prefetchQuery,
// prefetchInfiniteQuery, ensureQueryData, ensureInfiniteQueryData - defaults
// to retry: false, but only while defaultOptions.queries.retry is unset.
// Setting the interactive policy below would silently flip every loader
// prefetch from fail-fast to a backoff ladder that stalls navigations on
// deterministic failures (a failed prefetch already surfaces through its
// route or section boundary, which refetches under the interactive policy).
// Reapply the library guard before defaulting so imperative fetches stay
// single-attempt unless a call site passes its own retry.
class FailFastFetchQueryClient extends QueryClient {
  override fetchQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
    options: FetchQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): Promise<TData> {
    return super.fetchQuery({ ...options, retry: options.retry ?? false })
  }
}

export function getContext() {
  const queryClient = new FailFastFetchQueryClient({
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
