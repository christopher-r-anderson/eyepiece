import {
  dropTitleDuplicate,
  htmlToPlainText,
  isDecodableImageHref,
  toAssetImage,
} from '../../provider.utils'
import type { AssetImage, Rendition } from '@/domain/asset/asset.schema'
import type { NasaIvlSearchFilters } from '@/domain/search/providers/nasa-ivl-filters'
import type {
  NasaMediaItem,
  NasaMediaLink,
  NasaSearchParams,
} from '@/integrations/nasa-ivl/types'
import type { Pagination } from '@/domain/pagination/pagination.schema'
import type { SearchQuery } from '@/domain/search/search.schema'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { NASA_IMAGE_SOURCE_MAX_BYTES } from '@/domain/provider/provider-image-delivery'
import { albumKeySchema } from '@/domain/album/album.schema'
import { NASA_ALBUM_PAGE_SIZE } from '@/integrations/nasa-ivl/client'

// /search 400s any request whose window extends past its first 10,000
// results - including one that merely straddles the cap - while still
// reporting the full total_hits, so the walk has to stop early.
export const NASA_IVL_SEARCH_MAX_RESULTS = 10_000

export function clampNextPageToSearchDepthCap(
  next: number | null,
  pageSize: number,
): number | null {
  if (next === null) return null
  return next * pageSize <= NASA_IVL_SEARCH_MAX_RESULTS ? next : null
}

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

// the original is wider than the largest alternate on nearly every record and
// runs to tens of megabytes, so it joins the ladder only when it is small
// enough to hand to a visitor
const MAX_ORIGINAL_BYTES = 3 * 1024 * 1024

function toRendition(link: NasaMediaLink | undefined): Rendition | undefined {
  if (
    !link ||
    typeof link.width !== 'number' ||
    typeof link.height !== 'number'
  ) {
    return undefined
  }
  if (link.width <= 0 || link.height <= 0) return undefined
  if (!isDecodableImageHref(link.href)) return undefined
  // a file the delivery source refuses would break every candidate scaled
  // from it; undeclared sizes pass
  if ((link.size ?? 0) > NASA_IMAGE_SOURCE_MAX_BYTES) return undefined
  return { href: link.href, width: link.width, height: link.height }
}

// the canonical can be the unrotated camera file while every derivative is
// stored rotated (three of ~1300 sampled records, all KSC photographs), so
// its aspect only stands when the always-dimensioned preview agrees. The
// tolerance passes integer rounding on extreme panoramas.
function aspectAgrees(
  a: { width: number; height: number },
  b: { width: number; height: number },
) {
  const ratio = (a.width * b.height) / (a.height * b.width)
  return ratio > 1 / 1.1 && ratio < 1.1
}

function getImage(links: Array<NasaMediaLink>): AssetImage | undefined {
  const imageLinks = links.filter((link) => link.render === 'image')
  const canonical = imageLinks.find((link) => link.rel === 'canonical')
  // the preview is the only rendition present on every record, so it is what
  // keeps the ladder from coming back empty
  const preview = imageLinks.find((link) => link.rel === 'preview')
  const previewRendition = toRendition(preview)
  // a TIFF or oversized original is still the record's true size, and the
  // aspect ratio is what the grid breaks rows on
  const master =
    canonical?.width && canonical.height
      ? { width: canonical.width, height: canonical.height }
      : undefined
  const masterStands =
    master && (!previewRendition || aspectAgrees(master, previewRendition))
  // a rotated original is kept out of the ladder too: it would render
  // sideways inside a box every other rendition fills upright
  const original =
    masterStands &&
    canonical &&
    (canonical.size ?? Infinity) <= MAX_ORIGINAL_BYTES
      ? toRendition(canonical)
      : undefined
  return toAssetImage(
    [
      ...imageLinks.filter((link) => link.rel === 'alternate').map(toRendition),
      original,
      previewRendition,
    ],
    masterStands ? master : undefined,
  )
}

// the API returns no link to the record's own page, so it is built from the id
function buildSourceUrl(nasaId: string) {
  return `https://images.nasa.gov/details/${encodeURIComponent(nasaId)}`
}

// upstream album names that read as junk on tiles: "Test" is a grab-bag of
// thousands of unrelated records, "HST" holds only videos. Hidden from asset
// album lists; the album pages themselves stay reachable by URL.
const HIDDEN_ALBUM_IDS = new Set(['Test', 'HST'])

export function mapMediaItem({
  data,
  links,
}: {
  data: Array<NasaMediaItem>
  links: Array<NasaMediaLink>
}) {
  // Note data is an array but is always .length === 1
  const { album, title, description, nasa_id } = data[0]
  const albums = album
    ?.filter((albumId) => !HIDDEN_ALBUM_IDS.has(albumId))
    .map((albumId) =>
      albumKeySchema.parse({
        providerId: NASA_IVL_PROVIDER_ID,
        externalId: albumId,
      }),
    )
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
    albums: albums?.length ? albums : undefined,
    image: getImage(links),
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
