import { SITE_DESCRIPTION, SITE_ORIGIN } from './social-meta'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { AssetImage } from '@/domain/asset/asset.schema'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

// Head scripts render raw, so \u-escape the JSON: still valid, and provider
// strings cannot close the tag. The router does this natively for
// 'script:ld+json' meta entries; swap once the installed types know the key.
export function jsonLdScript(node: object) {
  return {
    type: 'application/ld+json',
    children: JSON.stringify(node)
      .replaceAll('&', '\\u0026')
      .replaceAll('<', '\\u003c')
      .replaceAll('>', '\\u003e'),
  }
}

// the SearchAction is what lets engines offer a sitelinks search box
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

// Smithsonian declares CC0 per record; NASA publishes no license URL, so its
// node points at the usage guidelines instead of claiming one
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
  image: AssetImage
  sourceUrl?: string
  providerId: ProviderId
  url: string
}) {
  // width/height describe the contentUrl file, not the master dimensions;
  // the schema guarantees at least one rendition
  const widest = image.renditions[0]!
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
