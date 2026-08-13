import { describe, expect, it } from 'vitest'
import {
  SITE_ORIGIN,
  canonicalLinks,
  canonicalMeta,
  canonicalUrl,
  socialMeta,
} from './social-meta'

const contentOf = (
  meta: ReturnType<typeof socialMeta>,
  key: string,
): string | undefined =>
  meta.find((entry) => entry.property === key || entry.name === key)?.content

describe('canonicalUrl', () => {
  it('addresses the home page with a trailing slash', () => {
    expect(canonicalUrl()).toBe(`${SITE_ORIGIN}/`)
  })

  it('embeds segments encoded and case-preserved', () => {
    expect(canonicalUrl('assets', 'nasa_ivl', 'PIA14417')).toBe(
      `${SITE_ORIGIN}/assets/nasa_ivl/PIA14417`,
    )
    expect(canonicalUrl('albums', 'nasa_ivl', 'Apollo 11')).toBe(
      `${SITE_ORIGIN}/albums/nasa_ivl/Apollo%2011`,
    )
  })

  it('pairs the canonical link with a matching og:url', () => {
    const url = canonicalUrl('collections', 'abc')
    expect(canonicalLinks(url)).toEqual([{ rel: 'canonical', href: url }])
    expect(canonicalMeta(url)).toEqual([{ property: 'og:url', content: url }])
  })
})

describe('socialMeta', () => {
  it('absolutizes a site-relative image url', () => {
    const meta = socialMeta({ title: 't', image: { url: '/og.jpg' } })
    expect(contentOf(meta, 'og:image')).toBe(`${SITE_ORIGIN}/og.jpg`)
  })

  it('passes an absolute image url through', () => {
    const meta = socialMeta({
      title: 't',
      image: { url: 'https://images-assets.nasa.gov/x.jpg' },
    })
    expect(contentOf(meta, 'og:image')).toBe(
      'https://images-assets.nasa.gov/x.jpg',
    )
  })

  it('emits dimensions only when both are known', () => {
    const withDims = socialMeta({
      title: 't',
      image: { url: '/og.jpg', width: 1200, height: 630 },
    })
    expect(contentOf(withDims, 'og:image:width')).toBe('1200')
    expect(contentOf(withDims, 'og:image:height')).toBe('630')

    const withoutDims = socialMeta({ title: 't', image: { url: '/og.jpg' } })
    expect(contentOf(withoutDims, 'og:image:width')).toBeUndefined()
  })

  it('collapses whitespace and trims a long description at a word', () => {
    const meta = socialMeta({
      title: 't',
      description: `${'space  and\n stars '.repeat(30)}end`,
    })
    const description = contentOf(meta, 'og:description') ?? ''
    expect(description.length).toBeLessThanOrEqual(200)
    expect(description.endsWith('…')).toBe(true)
    expect(description).not.toMatch(/\s{2,}/)
    expect(contentOf(meta, 'description')).toBe(description)
  })

  it('keeps a short description verbatim and omits an absent one', () => {
    expect(
      contentOf(
        socialMeta({ title: 't', description: 'short' }),
        'og:description',
      ),
    ).toBe('short')
    expect(
      contentOf(socialMeta({ title: 't' }), 'og:description'),
    ).toBeUndefined()
  })
})
