import { NOT_FOUND_IMAGE, paginationToRange } from '../../provider.utils'
import type {
  SioaAssetItem,
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

export function mapAssetItem(assetItem: SioaAssetItem) {
  return {
    title: assetItem.title,
    description: assetItem.title,

    key: {
      externalId: assetItem.id,
      providerId: SI_OA_PROVIDER_ID,
    },
    ...getImages(
      assetItem.content.descriptiveNonRepeating.online_media?.media[0]
        ?.resources,
    ),
  }
}
