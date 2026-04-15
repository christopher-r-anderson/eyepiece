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

function ensureImage(image: unknown) {
  if (image === null || typeof image !== 'object') {
    return { ...NOT_FOUND_IMAGE }
  }
  return {
    href:
      'url' in image && typeof image.url === 'string'
        ? image.url
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

const RESOURCE_LABELS = {
  orig: 'High-resolution JPEG',
  standard: 'Screen Image',
  thumb: 'Thumbnail Image',
} as const

function getImage(
  resources: Array<SioaResourceItem>,
  label: (typeof RESOURCE_LABELS)[keyof typeof RESOURCE_LABELS],
): Image {
  return ensureImage(resources.find((resource) => resource.label === label))
}

function getImages(resources: Array<SioaResourceItem> = []) {
  return {
    thumbnail: getImage(resources, RESOURCE_LABELS.thumb),
    image: getImage(resources, RESOURCE_LABELS.standard),
    original: getImage(resources, RESOURCE_LABELS.orig),
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
    mediaType: 'image' as const,
    ...getImages(
      assetItem.content.descriptiveNonRepeating.online_media?.media[0]
        ?.resources,
    ),
  }
}
