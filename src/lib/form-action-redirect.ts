import { redirect } from '@tanstack/react-router'

// Native (no-JS) form actions must always end in a redirect; 303 turns the
// form POST into a GET at the target, where 307 would re-POST
export function redirectWithParams(
  href: string,
  params: Record<string, string | undefined> = {},
): never {
  const url = new URL(href, 'http://relative.local')
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value)
    }
  }
  throw redirect({
    href: `${url.pathname}${url.search}${url.hash}`,
    statusCode: 303,
  })
}
