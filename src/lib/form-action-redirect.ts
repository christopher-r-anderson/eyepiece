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
      // Supabase codes are open-ended; one longer than the route schema's
      // 64 cap would fail validation at the target, and a truncated code
      // would not match the copy map anyway - degrade it to the sentinel
      url.searchParams.set(
        key,
        key === 'formError' && value.length > 64 ? 'unknown' : value,
      )
    }
  }
  throw redirect({
    href: `${url.pathname}${url.search}${url.hash}`,
    statusCode: 303,
  })
}
