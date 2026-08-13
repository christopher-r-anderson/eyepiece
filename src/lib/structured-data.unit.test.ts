import { describe, expect, it } from 'vitest'
import {
  collectionPageJsonLd,
  imageObjectJsonLd,
  jsonLdScript,
  webSiteJsonLd,
} from './structured-data'
import { SITE_ORIGIN } from './social-meta'
import type { AssetImage } from '@/domain/asset/asset.schema'

const image: AssetImage = {
  width: 2000,
  height: 1000,
  renditions: [
    {
      href: 'https://images-assets.nasa.gov/x~orig.jpg',
      width: 2000,
      height: 1000,
    },
    {
      href: 'https://images-assets.nasa.gov/x~medium.jpg',
      width: 1280,
      height: 640,
    },
  ],
}

describe('jsonLdScript', () => {
  it('keeps markup in strings from closing the script tag', () => {
    const script = jsonLdScript({ description: 'a </script> b & c' })
    expect(script.type).toBe('application/ld+json')
    expect(script.children).not.toContain('<')
    expect(script.children).not.toContain('>')
    expect(script.children).not.toContain('&')
    expect(JSON.parse(script.children)).toEqual({
      description: 'a </script> b & c',
    })
  })
})

describe('webSiteJsonLd', () => {
  it('points its SearchAction at the search page template', () => {
    const node = webSiteJsonLd()
    expect(node['@type']).toBe('WebSite')
    expect(node.url).toBe(`${SITE_ORIGIN}/`)
    expect(node.potentialAction.target).toBe(
      `${SITE_ORIGIN}/search?q={search_term_string}`,
    )
    expect(node.potentialAction['query-input']).toBe(
      'required name=search_term_string',
    )
  })
})

describe('collectionPageJsonLd', () => {
  it('carries name and url, and description only when given', () => {
    const url = `${SITE_ORIGIN}/collections/abc`
    expect(collectionPageJsonLd({ name: 'Nebulae', url })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Nebulae',
      url,
    })
    expect(
      collectionPageJsonLd({ name: 'Nebulae', description: 'd', url }),
    ).toHaveProperty('description', 'd')
  })
})

describe('imageObjectJsonLd', () => {
  const base = {
    title: 'Dumbbell Nebula',
    image,
    providerId: 'nasa_ivl',
    url: `${SITE_ORIGIN}/assets/nasa_ivl/PIA14417`,
  } as const

  it('describes the widest rendition and the page it lives on', () => {
    const node = imageObjectJsonLd(base)
    expect(node.contentUrl).toBe('https://images-assets.nasa.gov/x~orig.jpg')
    expect(node.width).toBe(2000)
    expect(node.height).toBe(1000)
    expect(node.mainEntityOfPage).toBe(base.url)
  })

  it('links the provider record page as sameAs only when present', () => {
    const sourceUrl = 'https://images.nasa.gov/details/PIA14417'
    expect(imageObjectJsonLd({ ...base, sourceUrl })).toHaveProperty(
      'sameAs',
      sourceUrl,
    )
    expect(imageObjectJsonLd(base)).not.toHaveProperty('sameAs')
  })

  it('claims CC0 for Smithsonian and only a usage page for NASA', () => {
    const si = imageObjectJsonLd({ ...base, providerId: 'si_oa' })
    expect(si).toHaveProperty(
      'license',
      'https://creativecommons.org/publicdomain/zero/1.0/',
    )
    expect(si).not.toHaveProperty('acquireLicensePage')

    const nasa = imageObjectJsonLd(base)
    expect(nasa).toHaveProperty(
      'acquireLicensePage',
      'https://www.nasa.gov/nasa-brand-center/images-and-media/',
    )
    expect(nasa).not.toHaveProperty('license')
  })

  it('includes a description only when the asset has one', () => {
    expect(imageObjectJsonLd({ ...base, description: 'd' })).toHaveProperty(
      'description',
      'd',
    )
    expect(imageObjectJsonLd(base)).not.toHaveProperty('description')
  })
})
