import { Suspense } from 'react'
import { CatchBoundary, createFileRoute } from '@tanstack/react-router'
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
import { CollectionCard } from '@/features/collections/components/collection-card'
import {
  getProfileOptions,
  useSuspenseProfile,
} from '@/features/profiles/profiles.queries'
import { makeProfilesRepo } from '@/features/profiles/profiles.repo'
import { CapturedAlertError } from '@/app/layout/route-error'
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
    <div className={css({ width: '100%' })}>
      <section
        className={css({
          paddingTop: '40px',
          paddingBottom: '44px',
          maxWidth: '720px',
        })}
      >
        <h1 className={css({ textStyle: 'display.md' })}>
          A personal view of public space photography
        </h1>
        <p
          className={css({
            marginTop: '4',
            color: 'text.muted',
            maxWidth: '46ch',
          })}
        >
          Search the NASA and Smithsonian open collections
        </p>
        <SearchBar
          initialQuery=""
          scope={{ scope: 'all' }}
          css={css.raw({
            marginTop: '6',
            maxWidth: '560px',
            fontSize: 'lg',
          })}
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
                  css={css.raw({
                    fontFamily: 'mono',
                    fontSize: 'mono',
                    textTransform: 'lowercase',
                  })}
                >
                  {query}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
      {FEATURED_ALBUMS.map((featured) => (
        <div
          key={featured.albumKey.externalId}
          className={css({ marginTop: 'sectionGap' })}
        >
          <AlbumStripSection
            albumKey={featured.albumKey}
            title={featured.title}
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
        css={css.raw({ textStyle: 'title.md', marginBottom: '4' })}
      >
        <span
          className={css({
            display: 'block',
            fontFamily: 'mono',
            fontSize: 'mono',
            color: 'text.muted',
            marginBottom: '1',
          })}
        >
          starting points
        </span>
        Public collections
      </Heading>
      <CatchBoundary
        getResetKey={() => hashKey(['home-collections'])}
        errorComponent={({ error }) => (
          <CapturedAlertError
            error={error}
            message="Couldn't load collections right now."
            captureContext={{
              boundaryKind: 'catch',
              feature: 'home',
              operation: 'load_collection_cards',
            }}
          />
        )}
      >
        <Suspense fallback={<CollectionCardsSkeleton />}>
          <CollectionCards />
        </Suspense>
      </CatchBoundary>
    </section>
  )
}

const cardGridCss = css.raw({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '5',
  mdDown: { gridTemplateColumns: '1fr' },
})

function CollectionCards() {
  const cards = useSuspensePublicCollectionCards(SHOWCASE_CURATION.user.id)
  const owner = useSuspenseProfile(SHOWCASE_CURATION.user.id)
  if (cards.length === 0) {
    return (
      <p className={css({ color: 'text.muted' })}>No public collections yet.</p>
    )
  }
  return (
    <ul
      // Safari drops list semantics with list-style: none
      role="list"
      className={css(cardGridCss, {
        listStyle: 'none',
        paddingInlineStart: '0',
      })}
    >
      {cards.map((card) => (
        <li key={card.collection.id} className={css({ minWidth: 0 })}>
          <CollectionCard card={card} curatedBy={owner?.displayName} />
        </li>
      ))}
    </ul>
  )
}

function CollectionCardsSkeleton() {
  return (
    <div aria-hidden="true" className={css(cardGridCss)}>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index}>
          <div
            className={css({
              width: '100%',
              aspectRatio: 2.1,
              backgroundColor: 'assetTile.bg',
            })}
          />
          <div
            className={css({
              height: '1.1875rem',
              width: '60%',
              marginTop: '2',
              backgroundColor: 'bg.surface.1',
            })}
          />
        </div>
      ))}
    </div>
  )
}
