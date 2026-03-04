export function paramsToUiResetKey(params: any) {
  const { page, ...rest } = params
  // stable string
  return JSON.stringify(
    Object.keys(rest)
      .sort()
      .map((k) => [k, rest[k] ?? '']),
  )
}
