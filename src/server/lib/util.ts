import sanitizeHtml from 'sanitize-html'
import type { NasaMediaItem, NasaMediaLink } from './nasa-images/types'

function getThumbnail(links: Array<NasaMediaLink>): NasaMediaLink | undefined {
  return links.find((link) => link.render === 'image' && link.rel === 'preview')
}

function getOriginal(links: Array<NasaMediaLink>): NasaMediaLink | undefined {
  return links.find(
    (link) => link.render === 'image' && link.rel === 'canonical',
  )
}

function getLargestAltImage(
  links: Array<NasaMediaLink>,
): NasaMediaLink | undefined {
  return [
    ...links.filter(
      (link) => link.render === 'image' && link.rel === 'alternate',
    ),
  ].sort((a, b) => (b.width || 0) - (a.width || 0))[0]
}

export function mapMediaItem({
  data,
  links,
}: {
  data: Array<NasaMediaItem>
  links: Array<NasaMediaLink>
}) {
  // Note data is an array but is always .length === 1
  const { album, title, description, nasa_id, media_type } = data[0]
  const thumbnail = getThumbnail(links)
  const original = getOriginal(links)
  const image = getLargestAltImage(links)
  return {
    title,
    description: htmlToPlainText(description),
    id: nasa_id,
    albums: album,
    thumbnail: thumbnail && {
      href: thumbnail.href,
      width: thumbnail.width,
      height: thumbnail.height,
    },
    image: image && {
      href: image.href,
      width: image.width,
      height: image.height,
    },
    original: original && {
      href: original.href,
      width: original.width,
      height: original.height,
    },
    mediaType: media_type,
  }
}

function htmlToPlainText(input: string): string {
  const normalized = input
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n')
    .replace(/<\/\s*div\s*>/gi, '\n')
  const text = sanitizeHtml(normalized, {
    allowedTags: [],
    allowedAttributes: {},
  })
  return text.replace(/\n{3,}/g, '\n\n').trim()
}
