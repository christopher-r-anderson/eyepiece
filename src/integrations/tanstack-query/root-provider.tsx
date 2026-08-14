import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Deliberately default-configured. The library already fails fast where it
// matters: imperative fetches (fetchQuery and the prefetch/ensure methods
// route loaders use) default to retry: false, and server-side fetches
// default to zero retries - but both guards only hold while
// defaultOptions.queries.retry is unset. A global retry option here would
// silently put a backoff ladder inside every route-loader prefetch; the
// fail-fast unit tests pin this invariant. Wanting different retry behavior
// for one query means setting retry on that query's options.
// https://github.com/TanStack/query/discussions/3558
export function getContext() {
  const queryClient = new QueryClient()
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
