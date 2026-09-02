import { AsyncLocalStorage } from 'node:async_hooks'

type RequestAttribution = {
  label: string
  referer: string | null
}

const attributionStorage = new AsyncLocalStorage<RequestAttribution>()

export function runWithRequestAttribution<T>(request: Request, fn: () => T): T {
  const url = new URL(request.url)
  return attributionStorage.run(
    {
      label: `${request.method} ${url.pathname}${url.search}`,
      referer: request.headers.get('referer'),
    },
    fn,
  )
}

// Which request a server-side side effect belongs to, for logs that fire
// far from the handler (a provider fixture miss). Empty outside a request.
export function describeCurrentRequest(): string {
  const attribution = attributionStorage.getStore()
  if (!attribution) return ''
  const referer = attribution.referer ? ` referer=${attribution.referer}` : ''
  return `during ${attribution.label}${referer}`
}
