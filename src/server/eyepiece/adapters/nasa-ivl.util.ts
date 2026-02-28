import sanitizeHtml from 'sanitize-html'
import type { EyepieceApiSearchParams } from '@/lib/eyepiece-api-client/types'
import type {
  NasaMediaItem,
  NasaMediaLink,
  NasaSearchParams,
} from '@/integrations/nasa-ivl/types'
import { externalAssetIdSchema } from '@/domain/asset/asset.schemas'
import { toAssetKeyString } from '@/domain/asset/asset.util'
import {
  NASA_IVL_PROVIDER,
  providerSchema,
} from '@/domain/provider/provider.schemas'
import { albumKeySchema } from '@/domain/album/album.schemas'
import { NASA_ALBUM_PAGE_SIZE } from '@/integrations/nasa-ivl/client'

export const NOT_FOUND_IMAGE = {
  // A 1x1 transparent GIF
  href: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  width: 640,
  height: 480,
}

export function eyepieceToNasaSearchParams(
  params: EyepieceApiSearchParams,
): NasaSearchParams {
  const { q, mediaType, page, pageSize, yearStart, yearEnd } = params
  return {
    q,
    media_type: mediaType ? [mediaType] : undefined,
    year_start: yearStart,
    year_end: yearEnd,
    page,
    page_size: pageSize,
  }
}

function ensureImage(image: unknown) {
  if (image === null || typeof image !== 'object') {
    return { ...NOT_FOUND_IMAGE }
  }
  return {
    href:
      'href' in image && typeof image.href === 'string'
        ? image.href
        : NOT_FOUND_IMAGE.href,
    width:
      'width' in image && typeof image.width === 'number'
        ? image.width
        : NOT_FOUND_IMAGE.width,
    height:
      'height' in image && typeof image.height === 'number'
        ? image.height
        : NOT_FOUND_IMAGE.height,
  }
}

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
    description: description ? htmlToPlainText(description) : 'No description',
    id: toAssetKeyString({
      externalId: nasa_id,
      provider: NASA_IVL_PROVIDER,
    }),
    provider: providerSchema.parse(NASA_IVL_PROVIDER),
    externalId: externalAssetIdSchema.parse(nasa_id),
    albums: album
      ? album.map((albumId) =>
          albumKeySchema.parse({
            provider: NASA_IVL_PROVIDER,
            externalId: albumId,
          }),
        )
      : undefined,
    thumbnail: ensureImage(thumbnail),
    image: ensureImage(image),
    original: ensureImage(original),
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

export interface NasaAlbumRequestPlan {
  page: number
  sliceStart: number
  sliceEnd: number
}

// NASA Albums do not support page size, instead always returning 100 items per page
// This function will calculate which NASA album pages need to be fetched
// in order to satisfy a request for a given page and page size
// It returns an array of plans, each containing the NASA page to fetch
// and the slice of items to take from that page
export function calculateNasaAlbumRequests(
  page: number,
  pageSize: number,
  nasaPageSize: number = NASA_ALBUM_PAGE_SIZE,
): Array<NasaAlbumRequestPlan> {
  const startIndex = pageSize * (page - 1)
  const endIndex = startIndex + pageSize

  const startPage = Math.floor(startIndex / nasaPageSize)
  const endPage = Math.floor((endIndex - 1) / nasaPageSize)

  const plans = []
  for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
    const currentGlobalStartIndex = pageIndex * nasaPageSize
    const sliceStart = Math.max(0, startIndex - currentGlobalStartIndex)
    const sliceEnd = Math.min(nasaPageSize, endIndex - currentGlobalStartIndex)
    plans.push({ page: pageIndex + 1, sliceStart, sliceEnd })
  }
  return plans
}
