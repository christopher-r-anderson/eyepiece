export function urlSearchParamsFromEntries(
  entries: [string, string | number | undefined | null][],
) {
  const urlSearchParams = new URLSearchParams()
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) {
      urlSearchParams.append(key, String(value))
    }
  }
  return urlSearchParams
}
