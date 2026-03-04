import {
  getAlbum as nasaIvlAdapterGetAlbum,
  getAsset as nasaIvlAdapterGetAsset,
  getMetadata as nasaIvlAdapterGetMetadata,
  search as nasaIvlAdapterSearch,
} from '../adapters/nasa-ivl'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { AlbumKey } from '@/domain/album/album.schema'
import type {
  EyepieceApiSearchParams,
  EyepieceAssetResponse,
  EyepieceMetadata,
  EyepiecePagination,
} from '@/lib/eyepiece-api-client/types'

export function getAlbum(
  { externalId }: AlbumKey,
  pagination: EyepiecePagination,
) {
  return nasaIvlAdapterGetAlbum(externalId, pagination)
}

export async function getAsset({
  externalId,
}: AssetKey): Promise<EyepieceAssetResponse> {
  return await nasaIvlAdapterGetAsset(externalId)
}

export async function search(
  params: EyepieceApiSearchParams,
  pagination: EyepiecePagination,
) {
  return await nasaIvlAdapterSearch(params, pagination)
}

export async function getMetadata({
  externalId,
}: AssetKey): Promise<EyepieceMetadata> {
  return await nasaIvlAdapterGetMetadata(externalId)
}
