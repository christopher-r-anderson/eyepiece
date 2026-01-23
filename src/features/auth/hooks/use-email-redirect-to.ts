import { useLocation } from '@tanstack/react-router'
import { urlToNextParam } from '../util'

export function useEmailRedirectTo(next?: string) {
  const location = useLocation()
  const redirectTo = new URL('/auth/confirm', location.url.origin)
  let url
  if (next) {
    redirectTo.searchParams.set('next', urlToNextParam(next))
    url = redirectTo.toString()
  } else {
    // always include the ? because the email adds params to the link
    url = `${redirectTo.toString()}?`
  }
  return url
}
