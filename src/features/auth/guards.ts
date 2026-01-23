import { redirect } from '@tanstack/react-router'
import { hasServerClaims } from './server/has-server-claims'
import { urlToNextParam } from './util'
import type { ParsedLocation } from '@tanstack/react-router'

export async function requireAuthenticated({
  location,
}: {
  location: ParsedLocation
}) {
  const isValid = await hasServerClaims()
  if (!isValid) {
    throw redirect({
      to: '/login',
      search: { next: urlToNextParam(location.href) },
    })
  }
}

export async function requireAnonymous({
  search,
}: {
  search: { next?: string }
}) {
  const isAuthorized = await hasServerClaims()
  if (isAuthorized) {
    throw redirect({
      to: search.next ? urlToNextParam(search.next) : '/',
      statusCode: 302,
    })
  }
}
