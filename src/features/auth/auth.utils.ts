import type { ResultError } from '@/lib/result'
import { FORM_ERROR_COPY } from '@/components/form-errors'
import { STRIP_PARAMS } from '@/lib/utils'

export function stripAuthSearchParams<T extends Record<string, unknown>>(
  params: T,
) {
  const newParams = { ...params }
  for (const key of STRIP_PARAMS) {
    delete newParams[key]
  }
  return newParams as Omit<T, (typeof STRIP_PARAMS)[number]>
}

export function pickAuthSearchParams(params: Record<string, unknown>) {
  const picked: Record<string, unknown> = {}
  for (const key of STRIP_PARAMS) {
    if (params[key] !== undefined) {
      picked[key] = params[key]
    }
  }
  return picked
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
export function mapSupabaseAuthError(
  error: unknown,
): ResultError<string | undefined> {
  if (error && typeof error === 'object' && 'message' in error) {
    const code =
      'code' in error && typeof error.code === 'string' ? error.code : undefined
    // known codes take the app's copy so the hydrated path matches the
    // native one; unknown codes keep the upstream message client-side
    const copy = code ? FORM_ERROR_COPY[code] : undefined
    return {
      code,
      message: copy ?? (error as { message: string }).message,
    }
  }
  return {
    message: 'An unknown error occurred',
  }
}

// a masked URL (asset overlay) survives in-place auth navigations; typed
// as object because a runtime pathname cannot satisfy the router's static
// mask typing
export function preservedMaskOptions(location: {
  maskedLocation?: { pathname: string; search: unknown }
}): object {
  const { maskedLocation } = location
  if (!maskedLocation) {
    return {}
  }
  return {
    mask: {
      to: maskedLocation.pathname,
      search: maskedLocation.search,
      unmaskOnReload: true,
    },
  }
}
