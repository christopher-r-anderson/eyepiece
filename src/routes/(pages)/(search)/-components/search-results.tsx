import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { EyepiecePageSearchParams } from '@/lib/api/eyepiece/types'
import { useSearchResults } from '@/features/search/api/search-queries'
import { paramsToUiResetKey } from '@/features/listing/infinite-loader/util'
import { InfiniteLoader } from '@/features/listing/infinite-loader/infinite-loader'
import {
  AssetTile,
  AssetTileSkeleton,
} from '@/features/assets/components/asset-tile'
import {
  HybridGrid,
  ItemGridSkeleton,
} from '@/features/listing/item-grid/hybrid-grid'
import { HybridGridItem } from '@/features/listing/item-grid/hybrid-grid-item'
import { useEyepieceClient } from '@/lib/api/eyepiece/eyepiece-client-provider'
import {
  useToggleUserFavorite,
  useUserFavoritesIndex,
} from '@/features/favorites/favorites.queries'
import { FavoriteToggle } from '@/features/favorites/components/favorite-toggle'
import { useIsClientMounted } from '@/lib/hooks/use-is-client-mounted'
import { ToggleFavoriteErrorCodes } from '@/features/favorites/favorites.server'
import { useShowLoginModal } from '@/features/auth/hooks/use-show-auth-modal'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { fromAssetKeyString, toAssetKeyString } from '@/domain/asset/asset.util'
import { PrettyException } from '@/components/ui/error'

interface SearchResultsProps {
  searchParams: EyepiecePageSearchParams
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const navigate = useNavigate()
  const queueToastMessage = useQueueToastMessage()
  const showLoginModal = useShowLoginModal()
  const client = useEyepieceClient()
  const isClientMounted = useIsClientMounted()
  const userFavoritesIndex = useUserFavoritesIndex({
    enabled: isClientMounted,
  })
  const favoriteKeySet = useMemo(() => {
    if (!userFavoritesIndex.data) {
      return new Set<string>()
    }
    return new Set(
      userFavoritesIndex.data.map(({ provider, externalId }) =>
        toAssetKeyString({ provider, externalId }),
      ),
    )
  }, [userFavoritesIndex.data])
  const {
    variables,
    mutate: toggleFavorite,
    isPending: isToggleFavoritePending,
  } = useToggleUserFavorite()

  const currentlyTogglingKey = useMemo(() => {
    if (!variables) {
      return null
    }
    return toAssetKeyString({
      provider: variables.provider,
      externalId: variables.externalId,
    })
  }, [variables])

  const {
    data,
    isPending,
    isError,
    error: searchResultsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchResults(client, searchParams)

  const uiResetKey = useMemo(
    () => paramsToUiResetKey(searchParams),
    [searchParams],
  )

  if (isPending) {
    return <ItemGridSkeleton>{() => <AssetTileSkeleton />}</ItemGridSkeleton>
  }

  if (isError) {
    return <PrettyException error={searchResultsError} headingLevel={1} />
  }

  return (
    <InfiniteLoader
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      loadedCount={data.assets.length}
      uiResetKey={uiResetKey}
      css={{ width: '100%' }}
    >
      <HybridGrid css={{ width: '100%' }} items={data.assets}>
        {(item, itemProps) => (
          <HybridGridItem
            item={item}
            onRowAction={() => {
              navigate({
                to: `/assets/$assetId`,
                params: { assetId: item.externalId },
              })
            }}
            {...itemProps}
          >
            <AssetTile
              asset={item}
              actions={
                <FavoriteToggle
                  isDisabled={
                    !isClientMounted ||
                    userFavoritesIndex.isPending ||
                    isToggleFavoritePending
                  }
                  isSelected={
                    isToggleFavoritePending && currentlyTogglingKey === item.id
                      ? !favoriteKeySet.has(item.id)
                      : favoriteKeySet.has(item.id)
                  }
                  onChange={() =>
                    toggleFavorite(fromAssetKeyString(item.id), {
                      onError: (toggleFavoritesError) => {
                        if (
                          toggleFavoritesError.message ===
                          ToggleFavoriteErrorCodes.AUTH_REQUIRED
                        ) {
                          showLoginModal()
                        } else {
                          console.error(
                            'Error toggling favorite',
                            toggleFavoritesError,
                          )
                          queueToastMessage({
                            title: 'Error toggling favorite',
                            description:
                              'An unexpected error occurred while toggling favorite status.',
                          })
                        }
                      },
                    })
                  }
                />
              }
            />
          </HybridGridItem>
        )}
      </HybridGrid>
    </InfiniteLoader>
  )
}
