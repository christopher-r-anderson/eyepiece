import { SITE_DESCRIPTION, SITE_ORIGIN } from './social-meta'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { AssetImage } from '@/domain/asset/asset.schema'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

// Builders for the JSON-LD nodes routes emit through the head() scripts
// option, wrapped by jsonLdScript below. Values stay plain JSON.

// Head scripts render raw, so provider-derived strings could otherwise
// close the tag. \u escapes stay valid JSON and decode to the original
// characters on parse.
export function jsonLdScript(node: object) {
  return {
    type: 'application/ld+json',
    children: JSON.stringify(node)
      .replaceAll('&', '\\u0026')
      .replaceAll('<', '\\u003c')
      .replaceAll('>', '\\u003e'),
  }
}

// Site-wide node, emitted by the home page only. The SearchAction is what
// lets engines offer a sitelinks search box pointed at /search.
export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'eyepiece',
    description: SITE_DESCRIPTION,
    url: `${SITE_ORIGIN}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_ORIGIN}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function collectionPageJsonLd({
  name,
  description,
  url,
}: {
  name: string
  description?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    ...(description ? { description } : {}),
    url,
  }
}

// Rights metadata is provider-level: Smithsonian open access is CC0, while
// NASA imagery is public domain by policy with no canonical license URL, so
// its node points at NASA's usage guidelines instead of claiming one.
const PROVIDER_RIGHTS = {
  [SI_OA_PROVIDER_ID]: {
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  [NASA_IVL_PROVIDER_ID]: {
    acquireLicensePage:
      'https://www.nasa.gov/nasa-brand-center/images-and-media/',
  },
} as const satisfies Record<ProviderId, Record<string, string>>

export function imageObjectJsonLd({
  title,
  description,
  image,
  sourceUrl,
  providerId,
  url,
}: {
  title: string
  description?: string
  // dimensions come from the rendition serving as contentUrl, not the
  // master, so they describe the file the node points at
  image: AssetImage
  // the record's page at the provider
  sourceUrl?: string
  providerId: ProviderId
  url: string
}) {
  const widest = image.renditions[0]
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: title,
    ...(description ? { description } : {}),
    contentUrl: widest.href,
    width: widest.width,
    height: widest.height,
    mainEntityOfPage: url,
    ...(sourceUrl ? { sameAs: sourceUrl } : {}),
    ...PROVIDER_RIGHTS[providerId],
  }
}
