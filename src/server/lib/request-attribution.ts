import { AsyncLocalStorage } from 'node:async_hooks'

// the e2e suite names its running test on every request it makes, so a
// server-side log can be traced back to the spec that caused it
const SPEC_HEADER = 'x-e2e-spec'

type RequestAttribution = {
  label: string
  referer: string | null
  userAgent: string | null
  spec: string | null
}

const attributionStorage = new AsyncLocalStorage<RequestAttribution>()

export function runWithRequestAttribution<T>(request: Request, fn: () => T): T {
  const url = new URL(request.url)
  return attributionStorage.run(
    {
      label: `${request.method} ${url.pathname}${url.search}`,
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      spec: request.headers.get(SPEC_HEADER),
    },
    fn,
  )
}

// Which request a server-side side effect belongs to, for logs that fire
// far from the handler (a provider fixture read or miss). Empty outside a
// request. The user agent separates a browser's fetch from the server's
// own call to an api route during ssr.
export function describeCurrentRequest(): string {
  const attribution = attributionStorage.getStore()
  if (!attribution) return ''
  const parts = [`during ${attribution.label}`]
  if (attribution.referer) parts.push(`referer=${attribution.referer}`)
  if (attribution.userAgent) {
    parts.push(`ua=${JSON.stringify(attribution.userAgent)}`)
  }
  if (attribution.spec) parts.push(`spec=${JSON.stringify(attribution.spec)}`)
  return parts.join(' ')
}
