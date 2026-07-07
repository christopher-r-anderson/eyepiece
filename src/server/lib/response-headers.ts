export function getSetCookieAccessor(
  headers: Headers,
): (() => Array<string>) | null {
  const maybeGetSetCookie = (headers as Headers & { getSetCookie?: unknown })
    .getSetCookie

  if (typeof maybeGetSetCookie !== 'function') {
    return null
  }

  return maybeGetSetCookie.bind(headers) as () => Array<string>
}

export function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = getSetCookieAccessor(headers)
  if (getSetCookie) {
    return getSetCookie()
  }

  const setCookie = headers.get('set-cookie')
  return setCookie ? [setCookie] : []
}

export function cloneHeadersPreservingSetCookie(headers: Headers) {
  const newHeaders = new Headers(headers)
  const setCookies = getSetCookieHeaders(headers)
  if (setCookies.length === 0) {
    return newHeaders
  }

  newHeaders.delete('set-cookie')
  for (const setCookie of setCookies) {
    newHeaders.append('set-cookie', setCookie)
  }
  return newHeaders
}

export type ResponseHeaderUpdates = Record<string, string | null>

function applyHeaderUpdates(headers: Headers, updates: ResponseHeaderUpdates) {
  for (const [name, value] of Object.entries(updates)) {
    if (value === null) {
      headers.delete(name)
    } else {
      headers.set(name, value)
    }
  }
}

// Some runtimes make the headers of redirect/error Responses immutable and
// throw on mutation; fall back to rebuilding the response in that case.
export function setResponseHeadersSafely(
  response: Response,
  updates: ResponseHeaderUpdates,
): Response {
  try {
    applyHeaderUpdates(response.headers, updates)
    return response
  } catch {
    const newHeaders = cloneHeadersPreservingSetCookie(response.headers)
    applyHeaderUpdates(newHeaders, updates)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  }
}
