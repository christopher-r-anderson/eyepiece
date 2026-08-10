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

  it('routes NASA video-record stills, which live outside /image/', () => {
    const still =
      'https://images-assets.nasa.gov/video/NHQ_2019_0311/NHQ_2019_0311~small.jpg'
    expect(toDeliveryHref(still, 640, true)).toBe(
      `/.netlify/images?url=${encodeURIComponent(
        '/img/nasa/video/NHQ_2019_0311/NHQ_2019_0311~small.jpg',
      )}&w=640`,
    )
  })

  it('leaves SI labelled-resource fallback urls direct - the allowlist admits only IIIF', () => {
    for (const fallback of [
      'https://ids.si.edu/ids/download?id=NASM-A19721168000',
      'https://ids.si.edu/ids/delivery?id=NASM-A19721168000&max=640',
    ]) {
      expect(toDeliveryHref(fallback, 640, true)).toBe(fallback)
    }
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
