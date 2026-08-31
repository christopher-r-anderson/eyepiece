// Link-preview meta: scrapers read only the SSR document, and og:image
// must be an absolute URL.
export const SITE_ORIGIN = 'https://eyepiece.net'
export const SITE_DESCRIPTION =
  'Astronomy image search and collections across the NASA and Smithsonian archives'

const DESCRIPTION_MAX = 200

function trimDescription(text: string) {
  const collapsed = text.replace(/\s+/g, ' ').trim()
  if (collapsed.length <= DESCRIPTION_MAX) {
    return collapsed
  }
  const cut = collapsed.slice(0, DESCRIPTION_MAX - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 120))}…`
}

// Indexable pages are fully addressed by their paths, so canonicals carry no
// search params. Segments stay case-preserved: provider ids are case-sensitive
// upstream and a folded id fetches as not-found (docs/decisions/05-prerendering.md)
export function canonicalUrl(...segments: Array<string>) {
  if (segments.length === 0) {
    return `${SITE_ORIGIN}/`
  }
  return `${SITE_ORIGIN}/${segments.map(encodeURIComponent).join('/')}`
}

export function canonicalMeta(url: string) {
  return [{ property: 'og:url', content: url }]
}

export function canonicalLinks(url: string) {
  return [{ rel: 'canonical', href: url }]
}

export interface SocialImage {
  url: string
  width?: number
  height?: number
}

// og:title carries the page name alone - og:site_name supplies the site
export function socialMeta({
  title,
  description,
  image,
}: {
  title: string
  description?: string
  image?: SocialImage
}) {
  const imageUrl = image
    ? image.url.startsWith('http')
      ? image.url
      : `${SITE_ORIGIN}${image.url}`
    : undefined
  return [
    { property: 'og:title', content: title },
    ...(description
      ? [
          { name: 'description', content: trimDescription(description) },
          { property: 'og:description', content: trimDescription(description) },
        ]
      : []),
    ...(imageUrl ? [{ property: 'og:image', content: imageUrl }] : []),
    ...(image?.width && image.height
      ? [
          { property: 'og:image:width', content: String(image.width) },
          { property: 'og:image:height', content: String(image.height) },
        ]
      : []),
  ]
}
