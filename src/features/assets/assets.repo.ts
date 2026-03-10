import { useMemo } from 'react'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import { useEyepieceClient } from '@/lib/eyepiece-api-client/eyepiece-client-provider'

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

export function useAssetsRepo(): AssetsRepo {
  const client = useEyepieceClient()
  return useMemo(() => makeAssetsRepo(client), [client])
}
