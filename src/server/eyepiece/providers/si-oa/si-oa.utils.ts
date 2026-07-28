import {
  NOT_FOUND_IMAGE,
  dropTitleDuplicate,
  paginationToRange,
} from '../../provider.utils'
import type {
  SioaAssetItem,
  SioaFreetext,
  SioaResourceItem,
  SioaSearchParams,
} from '@/integrations/si-oa/types'
import type { Image } from '@/domain/asset/asset.schema'
import type { Pagination } from '@/domain/pagination/pagination.schema'
// import type { SioaProviderSearchQuery } from './si-oa.provider'
import type { SearchQuery } from '@/domain/search/search.schema'
import type { SioaSearchFilters } from '@/domain/search/providers/si-oa-filters'
import { SI_OA_PROVIDER_ID } from '@/domain/provider/provider.schema'

export function buildSioaSearchParams(
  query: SearchQuery,
  _filters: SioaSearchFilters,
  pagination: Pagination,
): SioaSearchParams {
  const { start, end } = paginationToRange(pagination)
  return {
    q: `${query} AND online_media_type:Images AND data_source:"National Air and Space Museum"`,
    start,
    rows: end - start + 1,
  }
}

const RESOURCE_LABELS = {
  orig: 'High-resolution JPEG',
  standard: 'Screen Image',
} as const

function usableDimensions(resource: SioaResourceItem | undefined) {
  if (
    resource &&
    typeof resource.width === 'number' &&
    resource.width > 0 &&
    typeof resource.height === 'number' &&
    resource.height > 0
  ) {
    return { width: resource.width, height: resource.height }
  }
  return undefined
}

function buildImage(
  resource: SioaResourceItem | undefined,
  siblingDimensions: { width: number; height: number } | undefined,
): Image {
  if (!resource || typeof resource.url !== 'string') {
    return { ...NOT_FOUND_IMAGE }
  }
  const dimensions = usableDimensions(resource) ?? siblingDimensions
  return {
    href: resource.url,
    width: dimensions?.width ?? NOT_FOUND_IMAGE.width,
    height: dimensions?.height ?? NOT_FOUND_IMAGE.height,
  }
}

function getImages(resources: Array<SioaResourceItem> = []) {
  // search responses carry dimensions only on the hi-res resources, but
  // every rendition in a media item shares the master image, so any
  // dimensioned sibling supplies the true aspect ratio for the rest
  // (some report 0x0 and fall through to the 4:3 fallback)
  const siblingDimensions = resources.map(usableDimensions).find(Boolean)
  const screen = buildImage(
    resources.find((resource) => resource.label === RESOURCE_LABELS.standard),
    siblingDimensions,
  )
  return {
    // the 150px thumb rendition upscales badly at grid row heights; the
    // screen rendition serves as the preview
    thumbnail: screen,
    image: screen,
    original: buildImage(
      resources.find((resource) => resource.label === RESOURCE_LABELS.orig),
      siblingDimensions,
    ),
  }
}

const SUMMARY_NOTE_LABEL = 'Summary'

function getSummary(freetext: SioaFreetext | undefined) {
  const summaries = (freetext?.notes ?? [])
    .filter((note) => note.label === SUMMARY_NOTE_LABEL)
    .map((note) => note.content?.trim())
    .filter(Boolean)
  return summaries.length > 0 ? summaries.join('\n\n') : undefined
}

export function mapAssetItem(assetItem: SioaAssetItem) {
  const { title, content } = assetItem
  const media = content.descriptiveNonRepeating.online_media?.media[0]
  return {
    title,
    // a record's summary is the curatorial description; the media item's
    // extended accessibility text covers the records that lack a usable one,
    // so each candidate is title-checked before the fallback is given up on
    description:
      dropTitleDuplicate(getSummary(content.freetext), title) ??
      dropTitleDuplicate(media?.extDescrAccessibility, title),
    // records say they have no alt with an empty string as often as by
    // omitting it; whether one is present is the API's fact to keep, so the
    // title fallback is left to the render
    alt: media?.altTextAccessibility?.trim() || undefined,
    key: {
      externalId: assetItem.id,
      providerId: SI_OA_PROVIDER_ID,
    },
    ...getImages(media?.resources),
  }
}
