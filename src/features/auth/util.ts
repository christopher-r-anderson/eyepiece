import { STRIP_PARAMS } from '@/lib/util'

export function stripAuthSearchParams<T extends Record<string, unknown>>(
  params: T,
) {
  const newParams = { ...params }
  for (const key of STRIP_PARAMS) {
    delete newParams[key]
  }
  return newParams as Omit<T, (typeof STRIP_PARAMS)[number]>
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
