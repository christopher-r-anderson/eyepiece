import {
  dropTitleDuplicate,
  isDecodableImageHref,
  paginationToRange,
  toAssetImage,
} from '../../provider.utils'
import type {
  SioaAssetItem,
  SioaFreetext,
  SioaMediaItem,
  SioaResourceItem,
  SioaSearchParams,
} from '@/integrations/si-oa/types'
import type { AssetImage } from '@/domain/asset/asset.schema'
import type { Pagination } from '@/domain/pagination/pagination.schema'
// import type { SioaProviderSearchQuery } from './si-oa.provider'
import type { SearchQuery } from '@/domain/search/search.schema'
import type { SioaSearchFilters } from '@/domain/search/providers/si-oa-filters'
import { buildIdsRenditionUrl } from '@/integrations/si-oa/client'
import { SI_OA_PROVIDER_ID } from '@/domain/provider/provider.schema'

export function buildSioaSearchParams(
  query: SearchQuery,
  _filters: SioaSearchFilters,
  pagination: Pagination,
): SioaSearchParams {
  const { start, end } = paginationToRange(pagination)
  return {
    q: `${query} AND online_media_type:Images AND media_usage:CC0 AND data_source:"National Air and Space Museum"`,
    start,
    rows: end - start + 1,
  }
}

// widths worth requesting from the master. The top of the ladder covers a
// detail image on a 2x display; past that the file costs more than the
// sharpness is worth, and the masters run to 12000px.
const MAX_RENDITION_WIDTH = 2560
const RENDITION_WIDTHS = [320, 640, 960, 1280, 1920, MAX_RENDITION_WIDTH]

export function usableDimensions(resource: SioaResourceItem | undefined) {
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

// only the hi-res resources ever declare a size
export function getDeclaredDimensions(media: SioaMediaItem | undefined) {
  return (media?.resources ?? []).map(usableDimensions).find(Boolean)
}

// records carry up to 94 media items; every consumer reads the first CC0
// one, since the site's rights claims cover everything it displays
export function getPrimaryMedia(assetItem: SioaAssetItem) {
  return assetItem.content.descriptiveNonRepeating.online_media?.media.find(
    (media) => media.usage?.access === 'CC0',
  )
}

function buildImage(
  media: SioaMediaItem | undefined,
  master: { width: number; height: number } | undefined,
): AssetImage | undefined {
  if (!media?.idsId || !master) {
    // no master to scale from: the labelled resources are all there is, and
    // only the ones declaring a size can be laid out
    return toAssetImage(
      (media?.resources ?? []).map((resource) => {
        const dimensions = usableDimensions(resource)
        return dimensions && isDecodableImageHref(resource.url)
          ? { href: resource.url, ...dimensions }
          : undefined
      }),
    )
  }
  const { idsId } = media
  // never ask for an upscale, and always offer the master itself
  const cap = Math.min(master.width, MAX_RENDITION_WIDTH)
  const widths = [...RENDITION_WIDTHS.filter((width) => width < cap), cap]
  return toAssetImage(
    widths.map((width) => ({
      href: buildIdsRenditionUrl(idsId, width),
      width,
      height: Math.max(1, Math.round((master.height * width) / master.width)),
    })),
    master,
  )
}

const SUMMARY_NOTE_LABEL = 'Summary'

function getSummary(freetext: SioaFreetext | undefined) {
  const summaries = (freetext?.notes ?? [])
    .filter((note) => note.label === SUMMARY_NOTE_LABEL)
    .map((note) => note.content?.trim())
    .filter(Boolean)
  return summaries.length > 0 ? summaries.join('\n\n') : undefined
}

export function mapAssetItem(
  assetItem: SioaAssetItem,
  // resolved by the adapter, which is where a delivery-service lookup can happen
  master?: { width: number; height: number },
) {
  const { title, content } = assetItem
  const media = getPrimaryMedia(assetItem)
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
    sourceUrl: content.descriptiveNonRepeating.record_link,
    key: {
      externalId: assetItem.id,
      providerId: SI_OA_PROVIDER_ID,
    },
    image: buildImage(media, master ?? getDeclaredDimensions(media)),
  }
}
