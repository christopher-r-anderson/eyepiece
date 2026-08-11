import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { wrap } from 'styled-system/patterns'
import { AlbumStripSection } from './-components/album-strip'
import { Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { SearchBar } from '@/features/search/components/search-bar'
import {
  FEATURED_ALBUMS,
  SUGGESTED_SEARCHES,
} from '@/features/home/home.curation'
import { SHOWCASE_CURATION } from '@/features/collections/collections.showcase'
import { prefetchInfiniteAlbum } from '@/features/albums/albums.queries'
import {
  prefetchPublicCollectionCards,
  useSuspensePublicCollectionCards,
} from '@/features/collections/collections.queries'
import {
  CollectionCardGrid,
  CollectionCardGridSkeleton,
} from '@/features/collections/components/collection-card-grid'
import {
  getProfileOptions,
  useSuspenseProfile,
} from '@/features/profiles/profiles.queries'
import { makeProfilesRepo } from '@/features/profiles/profiles.repo'
import { CapturedCatchBoundary } from '@/components/errors/captured-errors'
import { toSearchPageParams } from '@/features/search/search-page-params'

export const Route = createFileRoute('/(public)/(pages)/')({
  component: HomePage,
  loader: ({
    context: { queryClient, eyepieceClient, publicSupabaseClient },
  }) => {
    // not awaited: sections stream and settle into their own boundaries
    for (const featured of FEATURED_ALBUMS) {
      void prefetchInfiniteAlbum({
        albumKey: featured.albumKey,
        eyepieceClient,
        queryClient,
      })
    }
    void prefetchPublicCollectionCards({
      ownerId: SHOWCASE_CURATION.user.id,
      queryClient,
      publicSupabaseClient,
    })
    void queryClient.prefetchQuery(
      getProfileOptions({
        id: SHOWCASE_CURATION.user.id,
        repo: makeProfilesRepo(publicSupabaseClient),
      }),
    )
  },
})

function HomePage() {
  return (
    <div className={css({ width: 'full' })}>
      <section
        className={css({
          paddingTop: '[40px]',
          paddingBottom: '[44px]',
          maxWidth: '[720px]',
        })}
      >
        <h1 className={css({ textStyle: 'display.md' })}>
          A personal view of public space photography
        </h1>
        <p
          className={css({
            marginTop: '4',
            color: 'text.muted',
            maxWidth: '[46ch]',
          })}
        >
          Search the NASA and Smithsonian open collections
        </p>
        <SearchBar
          initialQuery=""
          scope={{ scope: 'all' }}
          css={{
            marginTop: '6',
            maxWidth: '[560px]',
            fontSize: 'lg',
          }}
        />
        <nav
          aria-label="Suggested searches"
          className={css({ marginTop: '4' })}
        >
          <ul
            role="list"
            className={wrap({
              gap: '3',
              align: 'baseline',
              listStyle: 'none',
              paddingInlineStart: '0',
            })}
          >
            {SUGGESTED_SEARCHES.map((query) => (
              <li key={query}>
                <Link
                  to="/search"
                  search={toSearchPageParams(query, { scope: 'all' })}
                  css={{
                    textStyle: 'meta',
                    textTransform: 'lowercase',
                  }}
                >
                  {query}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
      {FEATURED_ALBUMS.map((featured, index) => (
        <div
          key={featured.albumKey.externalId}
          className={css({ marginTop: 'sectionGap' })}
        >
          <AlbumStripSection
            albumKey={featured.albumKey}
            title={featured.title}
            startsInViewport={index === 0}
          />
        </div>
      ))}
      <div className={css({ marginTop: 'sectionGap' })}>
        <PublicCollectionsSection />
      </div>
    </div>
  )
}

function PublicCollectionsSection() {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId}>
      <Heading
        level={2}
        id={headingId}
        size="title-md"
        css={{ marginBottom: '4' }}
      >
        <span
          className={css({
            display: 'block',
            textStyle: 'meta',
            color: 'text.muted',
            marginBottom: '1',
          })}
        >
          starting points
        </span>
        Public collections
      </Heading>
      <CapturedCatchBoundary
        resetKey={hashKey(['home-collections'])}
        message="Couldn't load collections right now."
        captureContext={{
          boundaryKind: 'catch',
          feature: 'home',
          operation: 'load_collection_cards',
        }}
      >
        <Suspense fallback={<CollectionCardGridSkeleton />}>
          <CollectionCards />
        </Suspense>
      </CapturedCatchBoundary>
    </section>
  )
}

function CollectionCards() {
  const cards = useSuspensePublicCollectionCards(SHOWCASE_CURATION.user.id)
  const owner = useSuspenseProfile(SHOWCASE_CURATION.user.id)
  return <CollectionCardGrid cards={cards} curatedBy={owner?.displayName} />
}
