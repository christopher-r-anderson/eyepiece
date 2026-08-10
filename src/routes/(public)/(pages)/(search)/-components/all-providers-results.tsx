import { Suspense } from 'react'
import { CatchBoundary } from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { VisuallyHidden } from 'styled-system/jsx'
import { grid, wrap } from 'styled-system/patterns'
import { AssetResultsGrid } from './asset-results-grid'
import { EmptyResultsNotice } from './empty-results-notice'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { SearchQuery } from '@/domain/search/search.schema'
import { Heading } from '@/components/ui/heading'
import { CapturedCatchBoundary } from '@/components/errors/captured-errors'
import { Link } from '@/components/ui/link'
import { AssetGridSkeleton } from '@/features/assets/components/asset-grid-skeleton'
import { PROVIDERS, PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'
import { defaultSearchFilters } from '@/domain/search/search.schema'
import { toProviderSearchParams } from '@/features/search/search-page-params'
import {
  ALL_SCOPE_SECTION_SIZE,
  useSuspenseSearchSection,
  useSuspenseSearchTotal,
} from '@/features/search/search.queries'

// Sections own sibling Suspense/error boundaries so one provider failing
// or stalling never affects the others.
export function AllProvidersResults({ query }: { query: SearchQuery }) {
  return (
    <div className={grid({ gap: '7' })}>
      {PROVIDERS.map((providerId, index) => (
        <ProviderSection
          key={providerId}
          query={query}
          providerId={providerId}
          startsInViewport={index === 0}
        />
      ))}
    </div>
  )
}

interface ProviderSectionProps {
  query: SearchQuery
  providerId: ProviderId
  startsInViewport?: boolean
}

function ProviderSection({
  query,
  providerId,
  startsInViewport,
}: ProviderSectionProps) {
  const headingId = useId()
  const display = PROVIDER_DISPLAY[providerId]

  return (
    <section aria-labelledby={headingId}>
      <div
        className={wrap({
          justify: 'space-between',
          align: 'baseline',
          gap: '4',
          marginBottom: '4',
        })}
      >
        <Heading
          level={2}
          id={headingId}
          css={css.raw({ textStyle: 'title.md' })}
        >
          {display.displayName}
        </Heading>
        <CatchBoundary
          getResetKey={() => hashKey(['see-all', query, providerId])}
          errorComponent={() => null}
        >
          <Suspense
            fallback={
              <Link
                to="/search"
                search={toProviderSearchParams(query, providerId)}
              >
                {`See all from ${display.shortLabel}`}
              </Link>
            }
          >
            <SeeAllLink query={query} providerId={providerId} />
          </Suspense>
        </CatchBoundary>
      </div>
      <CapturedCatchBoundary
        resetKey={hashKey(['search-section', providerId, query])}
        message={`Couldn't load results from ${display.displayName}.`}
        captureContext={{
          boundaryKind: 'catch',
          feature: 'search',
          providerId,
          operation: 'load_search_section',
        }}
      >
        <Suspense
          fallback={<AssetGridSkeleton count={ALL_SCOPE_SECTION_SIZE} />}
        >
          <ProviderSectionResults
            query={query}
            providerId={providerId}
            startsInViewport={startsInViewport}
          />
        </Suspense>
      </CapturedCatchBoundary>
    </section>
  )
}

function SeeAllLink({ query, providerId }: ProviderSectionProps) {
  const total = useSuspenseSearchTotal(query, defaultSearchFilters(providerId))
  if (total === 0) {
    return null
  }
  // the visible text stays compact, but two providers with the same total
  // would otherwise share one accessible name; name the provider for
  // link-by-link screen-reader navigation
  return (
    <Link to="/search" search={toProviderSearchParams(query, providerId)}>
      See all {total}
      <VisuallyHidden>
        {' '}
        from {PROVIDER_DISPLAY[providerId].shortLabel}
      </VisuallyHidden>
    </Link>
  )
}

function ProviderSectionResults({
  query,
  providerId,
  startsInViewport,
}: ProviderSectionProps) {
  const { data } = useSuspenseSearchSection(
    query,
    defaultSearchFilters(providerId),
  )

  if (data.items.length === 0) {
    return <EmptyResultsNotice query={query} providerId={providerId} />
  }

  return (
    <AssetResultsGrid items={data.items} startsInViewport={startsInViewport} />
  )
}
