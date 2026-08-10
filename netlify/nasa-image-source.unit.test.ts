import { afterEach, describe, expect, it, vi } from 'vitest'
// beside edge-functions/, not in it: Netlify bundles every file there as a
// function
import handler from './edge-functions/nasa-image-source'

function stubUpstream(response: Response) {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
  return fetchSpy
}

const invoke = (path: string) =>
  handler(new Request(`https://eyepiece.net${path}`))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('nasa image source', () => {
  it('proxies the upstream path with the query preserved and our cache headers', async () => {
    const fetchSpy = stubUpstream(
      new Response('bytes', {
        status: 200,
        headers: { 'content-type': 'image/jpeg', 'content-length': '5' },
      }),
    )
    const response = await invoke(
      '/img/nasa/image/PIA24439/PIA24439~large.jpg?v=2',
    )
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://images-assets.nasa.gov/image/PIA24439/PIA24439~large.jpg?v=2',
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('public, max-age=604800')
    expect(response.headers.get('netlify-cdn-cache-control')).toBe(
      'public, durable, s-maxage=31536000',
    )
  })

  it('refuses undecodable formats without fetching upstream', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const response = await invoke('/img/nasa/image/PIA24439/PIA24439~orig.tif')
    expect(response.status).toBe(404)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('refuses upstream responses that do not declare a valid size', async () => {
    const cases: Array<Record<string, string>> = [
      { 'content-type': 'image/jpeg' },
      { 'content-type': 'image/jpeg', 'content-length': 'garbage' },
    ]
    for (const headers of cases) {
      stubUpstream(new Response('bytes', { status: 200, headers }))
      const response = await invoke(
        '/img/nasa/image/PIA24439/PIA24439~large.jpg',
      )
      expect(response.status).toBe(502)
      vi.restoreAllMocks()
    }
  })

  it('refuses files over the rendition byte cap', async () => {
    stubUpstream(
      new Response('big', {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': String(25 * 1024 * 1024),
        },
      }),
    )
    const response = await invoke('/img/nasa/image/big/big~orig.jpg')
    expect(response.status).toBe(413)
  })

  it('passes upstream errors through', async () => {
    stubUpstream(new Response('missing', { status: 404 }))
    const response = await invoke('/img/nasa/image/nope/nope~large.jpg')
    expect(response.status).toBe(404)
    expect(response.headers.get('netlify-cdn-cache-control')).toBeNull()
  })
})
