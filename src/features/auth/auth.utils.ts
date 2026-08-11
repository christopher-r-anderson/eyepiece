import type { ResultError } from '@/lib/result'
import { FORM_ERROR_COPY } from '@/lib/form-errors'

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
