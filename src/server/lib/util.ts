import { NasaMediaItem, NasaMediaLink } from './nasa-images/types'

export const NOT_FOUND_IMAGE = {
  href: '',
  width: 640,
  height: 480,
}

function getThumbnail(links: NasaMediaLink[]): NasaMediaLink | undefined {
  return links.find((link) => link.render === 'image' && link.rel === 'preview')
}

function getOriginal(links: NasaMediaLink[]): NasaMediaLink | undefined {
  return links.find(
    (link) => link.render === 'image' && link.rel === 'canonical',
  )
}

function getLargestAltImage(links: NasaMediaLink[]): NasaMediaLink | undefined {
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
  data: NasaMediaItem[]
  links: NasaMediaLink[]
}) {
  // Note data is an array but is always .length === 1
  const { album, title, description, nasa_id, media_type } = data[0]
  const thumbnail = getThumbnail(links)
  const original = getOriginal(links)
  const image = getLargestAltImage(links)
  return {
    title,
    description,
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
