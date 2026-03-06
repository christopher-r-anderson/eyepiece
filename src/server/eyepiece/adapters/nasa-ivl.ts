import { calculateNextPage } from '../service/utils'
import {
  calculateNasaAlbumRequests,
  eyepieceToNasaSearchParams,
  mapMediaItem,
} from './nasa-ivl.utils'
import type {
  EyepieceApiSearchParams,
  EyepieceAssetCollectionResponse,
  EyepieceAssetResponse,
  EyepiecePagination,
} from '@/lib/eyepiece-api-client/types'
import {
  getAlbum as nasaIvlGetAlbum,
  getMetadata as nasaIvlGetMetadata,
  search as nasaIvlSearch,
} from '@/integrations/nasa-ivl/client'

export async function getAlbum(id: string, pagination: EyepiecePagination) {
  // NASA Albums do not support page size, instead always returning 100 items per page
  // Therefore, we need to calculate which NASA album pages to fetch
  // and slice the results accordingly
  const plans = calculateNasaAlbumRequests(pagination.page, pagination.pageSize)
  const responses = await Promise.all(
    plans.map((plan) => nasaIvlGetAlbum(id, { page: plan.page })),
  )

  const total = responses[0].collection.metadata.total_hits
  const assets = []
  for (const [index, response] of responses.entries()) {
    const plan = plans[index]
    assets.push(
      ...response.collection.items
        .slice(plan.sliceStart, plan.sliceEnd)
        .map(mapMediaItem),
    )
  }
  const next = calculateNextPage(pagination, assets.length, total)
  const response: EyepieceAssetCollectionResponse = {
    assets,
    pagination: { next, total },
  }
  return response
}

export async function getAsset(id: string) {
  // NOTE: use search + nasa_id because the only other "detail" endpoint is the
  // metadata.json file which contains a lot of duplicate and extraneous data
  // It does contain line breaks in descriptions, which we are currently opting to do without
  const nasaResponse = await nasaIvlSearch({
    nasa_id: id,
  })
  if (nasaResponse.collection.items.length !== 1) {
    throw new Error(`Asset not found: ${id}`)
  }
  const item = nasaResponse.collection.items[0]
  const response: EyepieceAssetResponse = mapMediaItem(item)
  return response
}

export async function search(
  params: EyepieceApiSearchParams,
  pagination: EyepiecePagination,
) {
  const nasaSearchParams = eyepieceToNasaSearchParams(params)
  const nasaResponse = await nasaIvlSearch(nasaSearchParams)
  const assets = nasaResponse.collection.items.map(mapMediaItem)
  const total = nasaResponse.collection.metadata.total_hits
  const next = calculateNextPage(pagination, assets.length, total)
  const response: EyepieceAssetCollectionResponse = {
    assets,
    pagination: { next, total },
  }
  return response
}

export async function getMetadata(id: string) {
  return await nasaIvlGetMetadata(id)
}
