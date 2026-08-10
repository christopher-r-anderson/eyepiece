import { describe, expect, it } from 'vitest'
import { toDeliveryHref } from './image-delivery'

const NASA_HREF =
  'https://images-assets.nasa.gov/image/PIA24439/PIA24439~large.jpg'
const SI_HREF =
  'https://ids.si.edu/ids/iiif/NASM-A19721168000/full/2560,/0/default.jpg'

describe('toDeliveryHref', () => {
  it('routes an SI rendition through the image CDN as a remote source', () => {
    expect(toDeliveryHref(SI_HREF, 640, true)).toBe(
      `/.netlify/images?url=${encodeURIComponent(SI_HREF)}&w=640`,
    )
  })

  it('routes a NASA rendition through the same-site source path', () => {
    expect(toDeliveryHref(NASA_HREF, 1920, true)).toBe(
      `/.netlify/images?url=${encodeURIComponent(
        '/img/nasa/image/PIA24439/PIA24439~large.jpg',
      )}&w=1920`,
    )
  })

  it('keeps percent-encoding on NASA paths with spaces and emits no srcset-breaking characters', () => {
    const spaced =
      'https://images-assets.nasa.gov/image/Apollo%2011/a11~medium.jpg'
    const delivered = toDeliveryHref(spaced, 1280, true)
    expect(delivered).toContain(
      encodeURIComponent('/img/nasa/image/Apollo%2011/a11~medium.jpg'),
    )
    expect(delivered).not.toMatch(/[\s,]/)
  })

  it('passes through hrefs from origins outside the delivery map', () => {
    const href = 'https://example.test/photo.jpg'
    expect(toDeliveryHref(href, 640, true)).toBe(href)
  })

  it('passes through unparseable hrefs', () => {
    expect(toDeliveryHref('not-a-url', 640, true)).toBe('not-a-url')
  })

  it('passes through everything when delivery is disabled', () => {
    expect(toDeliveryHref(NASA_HREF, 640, false)).toBe(NASA_HREF)
    expect(toDeliveryHref(SI_HREF, 640, false)).toBe(SI_HREF)
  })
})
