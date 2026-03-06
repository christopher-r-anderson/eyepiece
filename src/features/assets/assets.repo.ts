import type { AssetKey } from '@/domain/asset/asset.schema'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'

export interface AssetsRepo {
  getAsset: (
    assetKey: AssetKey,
  ) => Promise<Awaited<ReturnType<EyepieceClient['getAsset']>>>
  getMetadata: (
    assetKey: AssetKey,
  ) => Promise<Awaited<ReturnType<EyepieceClient['getMetadata']>>>
}

export function makeAssetsRepo(client: EyepieceClient) {
  return {
    getAsset: (assetKey: AssetKey) => client.getAsset(assetKey),
    getMetadata: (assetKey: AssetKey) => client.getMetadata(assetKey),
  }
}
