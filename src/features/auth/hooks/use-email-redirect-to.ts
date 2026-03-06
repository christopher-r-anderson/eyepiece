import { getOrigin, urlToNextParam } from '@/lib/utils'

export function useEmailRedirectTo(next?: string) {
  const redirectTo = new URL('/auth/confirm', getOrigin())
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
