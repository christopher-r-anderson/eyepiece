import { describe, expect, it } from 'vitest'
import { SITE_ORIGIN, socialMeta } from './social-meta'

const contentOf = (
  meta: ReturnType<typeof socialMeta>,
  key: string,
): string | undefined =>
  meta.find((entry) => entry.property === key || entry.name === key)?.content

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
