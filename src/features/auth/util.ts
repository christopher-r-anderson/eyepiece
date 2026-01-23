const STRIP_PARAMS = ['auth', 'next', 'fp'] as const
const PARSE_BASE = 'http://parse.local'

export function stripAuthSearchParams<T extends Record<string, unknown>>(
  params: T,
) {
  const newParams = { ...params }
  for (const key of STRIP_PARAMS) {
    delete newParams[key]
  }
  return newParams as Omit<T, (typeof STRIP_PARAMS)[number]>
}

export function urlToNextParam(url: string) {
  const u = new URL(url, PARSE_BASE)
  for (const key of STRIP_PARAMS) u.searchParams.delete(key)
  return `${u.pathname}${u.search}${u.hash}`
}

export function isPlainLeftClick({
  button,
  metaKey,
  ctrlKey,
  shiftKey,
  altKey,
}: {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}) {
  return button === 0 && !metaKey && !ctrlKey && !shiftKey && !altKey
}
