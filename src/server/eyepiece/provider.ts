import type { z } from 'zod'
import type { Asset, Metadata } from '@/domain/asset/asset.schema'
import type {
  ProviderCapabilities,
  ProviderId,
} from '@/domain/provider/provider.schema'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import type { SearchQuery } from '@/domain/search/search.schema'

export interface BaseProvider<
  TProviderId extends ProviderId,
  TFilters extends z.ZodType,
> {
  getProviderId: () => TProviderId
  capabilities: ProviderCapabilities
  getSearchFiltersSchema: () => TFilters
  searchAssets: (
    query: SearchQuery,
    filters: z.infer<TFilters>,
    pagination: Pagination,
  ) => Promise<PaginatedCollection<Asset>>
  getAsset: (id: string) => Promise<Asset | null>
}

export interface AlbumsCapability {
  // potentially add separate method if getting albums is not always attached to the asset in provider search results
  // getAlbumsForAsset: (id: string) => Promise<Array<AlbumKey>>
  getAlbum: (
    id: string,
    pagination: Pagination,
  ) => Promise<PaginatedCollection<Asset>>
}

export interface MetadataCapability {
  getMetadata: (id: string) => Promise<Metadata>
}

export function hasAlbums<
  TProviderId extends ProviderId,
  TFilters extends z.ZodType,
>(
  provider: BaseProvider<TProviderId, TFilters>,
): provider is BaseProvider<TProviderId, TFilters> & AlbumsCapability {
  return (
    provider.capabilities.albums === true &&
    (provider as any).getAlbum !== undefined
  )
}

export function hasMetadata<
  TProviderId extends ProviderId,
  TFilters extends z.ZodType,
>(
  provider: BaseProvider<TProviderId, TFilters>,
): provider is BaseProvider<TProviderId, TFilters> & MetadataCapability {
  return (
    provider.capabilities.metadata === true &&
    (provider as any).getMetadata !== undefined
  )
}
