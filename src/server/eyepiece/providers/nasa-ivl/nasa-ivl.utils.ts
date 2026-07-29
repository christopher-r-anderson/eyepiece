import {
  NOT_FOUND_IMAGE,
  dropTitleDuplicate,
  htmlToPlainText,
} from '../../provider.utils'
import type { NasaIvlSearchFilters } from '@/domain/search/providers/nasa-ivl-filters'
import type {
  NasaMediaItem,
  NasaMediaLink,
  NasaSearchParams,
} from '@/integrations/nasa-ivl/types'
import type { Pagination } from '@/domain/pagination/pagination.schema'
import type { SearchQuery } from '@/domain/search/search.schema'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { albumKeySchema } from '@/domain/album/album.schema'
import { NASA_ALBUM_PAGE_SIZE } from '@/integrations/nasa-ivl/client'

export function buildNasaIvlSearchParams(
  query: SearchQuery,
  filters: NasaIvlSearchFilters,
  pagination: Pagination,
): NasaSearchParams {
  const { yearStart, yearEnd } = filters
  const { page, pageSize } = pagination
  return {
    q: query,
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

// the API returns no link to the record's own page, so it is built from the
// id the site addresses records by
function buildSourceUrl(nasaId: string) {
  return `https://images.nasa.gov/details/${encodeURIComponent(nasaId)}`
}

export function mapMediaItem({
  data,
  links,
}: {
  data: Array<NasaMediaItem>
  links: Array<NasaMediaLink>
}) {
  // Note data is an array but is always .length === 1
  const { album, title, description, nasa_id } = data[0]
  const thumbnail = getThumbnail(links)
  const original = getOriginal(links)
  const image = getLargestAltImage(links)
  return {
    title,
    description: dropTitleDuplicate(
      description ? htmlToPlainText(description) : undefined,
      title,
    ),
    sourceUrl: buildSourceUrl(nasa_id),
    key: {
      externalId: nasa_id,
      providerId: NASA_IVL_PROVIDER_ID,
    },
    albums: album
      ? album.map((albumId) =>
          albumKeySchema.parse({
            providerId: NASA_IVL_PROVIDER_ID,
            externalId: albumId,
          }),
        )
      : undefined,
    thumbnail: ensureImage(thumbnail),
    image: ensureImage(image),
    original: ensureImage(original),
  }
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
