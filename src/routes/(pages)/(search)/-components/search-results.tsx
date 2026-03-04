import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { EyepiecePageSearchParams } from '@/lib/eyepiece-api-client/types'
import { useSearchResults } from '@/features/search/search.queries'
import { paramsToUiResetKey } from '@/features/listing/infinite-loader/components/infinite-loader.utils'
import { InfiniteLoader } from '@/features/listing/infinite-loader/components/infinite-loader'
import {
  AssetTile,
  AssetTileSkeleton,
} from '@/features/assets/components/asset-tile'
import {
  HybridGrid,
  ItemGridSkeleton,
} from '@/features/listing/item-grid/components/hybrid-grid'
import { HybridGridItem } from '@/features/listing/item-grid/components/hybrid-grid-item'
import { useEyepieceClient } from '@/lib/eyepiece-api-client/eyepiece-client-provider'
import {
  useToggleUserFavorite,
  useUserFavoritesIndex,
} from '@/features/favorites/favorites.queries'
import { FavoriteToggle } from '@/features/favorites/components/favorite-toggle'
import { useIsClientMounted } from '@/lib/hooks/use-is-client-mounted'
import { ToggleFavoriteErrorCodes } from '@/features/favorites/favorites.server'
import { useShowLoginModal } from '@/features/auth/hooks/use-show-auth-modal'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import {
  fromAssetKeyString,
  toAssetKeyString,
} from '@/domain/asset/asset.utils'
import { PrettyException } from '@/components/ui/error'
import { AlbumLinkList } from '@/features/albums/components/album-link-list'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import { makeUserFavoritesRepo } from '@/features/favorites/favorites.repo'
import { makeUserFavoritesCommands } from '@/features/favorites/favorites.commands'
import { makeSearchRepo } from '@/features/search/search.repo'

interface SearchResultsProps {
  searchParams: EyepiecePageSearchParams
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const navigate = useNavigate()
  const queueToastMessage = useQueueToastMessage()
  const showLoginModal = useShowLoginModal()
  const isClientMounted = useIsClientMounted()
  const eyepieceClient = useEyepieceClient()
  const searchRepo = makeSearchRepo(eyepieceClient)
  const userFavoritesRepo = makeUserFavoritesRepo(createUserSupabaseClient())
  const userFavoritesIndex = useUserFavoritesIndex({
    repo: userFavoritesRepo,
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
  const userFavoritesCommands = makeUserFavoritesCommands()
  const {
    variables,
    mutate: toggleFavorite,
    isPending: isToggleFavoritePending,
  } = useToggleUserFavorite(userFavoritesCommands)

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
  } = useSearchResults(searchRepo, searchParams)

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
              relatedLinks={
                item.albums ? <AlbumLinkList albums={item.albums} /> : undefined
              }
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
