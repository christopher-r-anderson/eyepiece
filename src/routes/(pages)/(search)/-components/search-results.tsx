import { useMemo } from 'react'
import { useHydrated, useNavigate } from '@tanstack/react-router'
import type { EyepiecePageSearchParams } from '@/lib/eyepiece-api-client/types'
import { useSuspenseInfiniteSearch } from '@/features/search/search.queries'
import { paramsToUiResetKey } from '@/features/listing/infinite-loader/components/infinite-loader.utils'
import { InfiniteLoader } from '@/features/listing/infinite-loader/components/infinite-loader'
import { AssetTile } from '@/features/assets/components/asset-tile'
import { HybridGrid } from '@/features/listing/item-grid/components/hybrid-grid'
import { HybridGridItem } from '@/features/listing/item-grid/components/hybrid-grid-item'
import {
  useToggleUserFavorite,
  useUserFavoritesIndex,
} from '@/features/favorites/favorites.queries'
import { FavoriteToggle } from '@/features/favorites/components/favorite-toggle'
import { ToggleFavoriteErrorCodes } from '@/features/favorites/favorites.const'
import { useShowLoginModal } from '@/features/auth/hooks/use-show-auth-modal'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import {
  fromAssetKeyString,
  toAssetKeyString,
} from '@/domain/asset/asset.utils'
import { AlbumLinkList } from '@/features/albums/components/album-link-list'

interface SearchResultsProps {
  searchParams: EyepiecePageSearchParams
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const navigate = useNavigate()
  const queueToastMessage = useQueueToastMessage()
  const showLoginModal = useShowLoginModal()
  const isHydrated = useHydrated()
  const userFavoritesIndex = useUserFavoritesIndex({
    enabled: isHydrated,
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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteSearch(searchParams)

  const uiResetKey = useMemo(
    () => paramsToUiResetKey(searchParams),
    [searchParams],
  )

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
              relatedLinks={
                item.albums ? <AlbumLinkList albums={item.albums} /> : undefined
              }
              actions={
                <FavoriteToggle
                  isDisabled={
                    !isHydrated ||
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
