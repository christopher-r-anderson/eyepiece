import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type {
  DefaultError,
  EnsureQueryDataOptions,
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

// Imperative fetches (fetchQuery and the prefetch/ensure methods built on
// it) default to retry: false in the library, but only while
// defaultOptions.queries.retry is unset - the interactive policy below
// would silently put a backoff ladder inside every route-loader prefetch.
// A failed prefetch already surfaces through its route or section
// boundary, which refetches under the interactive policy, so keep
// imperative fetches single-attempt unless a call site passes its own
// retry. Both funnel methods need the override: ensureQueryData hands
// already-defaulted options to prefetchQuery on its revalidateIfStale
// path, past the fetchQuery guard.
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

  override ensureQueryData<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: EnsureQueryDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData> {
    return super.ensureQueryData({ ...options, retry: options.retry ?? false })
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
