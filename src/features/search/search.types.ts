import type {
  EyepieceApiSearchParams,
  EyepieceAssetCollectionResponse,
  EyepieceAssetItem,
} from '@/lib/eyepiece-api-client/types'

export type SearchQuery = Pick<
  EyepieceApiSearchParams,
  'q' | 'mediaType' | 'yearStart' | 'yearEnd' | 'page' | 'pageSize'
>

export type SearchResults = Pick<
  EyepieceAssetCollectionResponse,
  'pagination'
> & {
  // TODO: this should be based on internal domain types and so should the eyepiece api return types
  // it is internal and - other than transport related concerns - it is returning domain types.
  assets: Array<
    Pick<
      EyepieceAssetItem,
      | 'id'
      | 'provider'
      | 'externalId'
      | 'title'
      | 'description'
      | 'albums'
      | 'photographer'
      | 'image'
      | 'thumbnail'
      | 'original'
      | 'mediaType'
    >
  >
}
