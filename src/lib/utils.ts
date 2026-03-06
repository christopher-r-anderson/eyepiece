import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

const PARSE_BASE = 'http://parse.local'

export const STRIP_PARAMS = ['auth', 'next', 'fp'] as const

export const getTitleText = (title: string | undefined) => {
  return title
    ? `${title} | eyepiece: NASA Media Explorer`
    : 'eyepiece: NASA Media Explorer'
}

export function urlToNextParam(url: string) {
  const u = new URL(url, PARSE_BASE)
  for (const key of STRIP_PARAMS) u.searchParams.delete(key)
  return `${u.pathname}${u.search}${u.hash}`
}

export const getOrigin = createIsomorphicFn()
  .server(() => new URL(getRequest().url).origin)
  .client(() => window.location.origin)
