import { createElement } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SearchFilters } from '@/domain/search/search.schema'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'
import { stringifySearchParams } from '@/lib/search-params'

vi.mock('@/components/ui/link', () => ({
  Link: ({
    to,
    search,
    children,
    ...rest
  }: Record<string, unknown> & {
    to: string
    search: Record<string, string>
    children: React.ReactNode
  }) =>
    createElement(
      'a',
      { ...rest, href: `${to}${stringifySearchParams(search)}` },
      children,
    ),
}))

const capturedAlertContexts: Array<unknown> = []
vi.mock('@/app/layout/route-error', () => ({
  CapturedAlertError: ({
    message,
    captureContext,
  }: {
    message: React.ReactNode
    captureContext?: unknown
  }) => {
    capturedAlertContexts.push(captureContext)
    return createElement('p', { role: 'alert' }, message)
  },
}))

vi.mock('./asset-results-grid', () => ({
  AssetResultsGrid: ({ items }: { items: Array<unknown> }) =>
    createElement('div', { 'data-testid': 'asset-grid' }, `${items.length}`),
}))

const mockUseSuspenseSearchSection = vi.fn()
const mockUseSearchTotal = vi.fn()
vi.mock('@/features/search/search.queries', () => ({
  ALL_SCOPE_SECTION_SIZE: 6,
  useSuspenseSearchSection: (query: string, filters: SearchFilters) =>
    mockUseSuspenseSearchSection(query, filters),
  useSearchTotal: (query: string, filters: SearchFilters) =>
    mockUseSearchTotal(query, filters),
}))

const { AllProvidersResults } = await import('./all-providers-results')

function sectionData(count: number, total = count) {
  return {
    data: {
      items: Array.from({ length: count }, (_, index) => ({
        key: { externalId: `asset-${index}` },
      })),
      total,
    },
  }
}

describe('all providers results', () => {
  beforeEach(() => {
    mockUseSuspenseSearchSection.mockReset()
    mockUseSearchTotal.mockReset()
    mockUseSearchTotal.mockReturnValue(undefined)
    capturedAlertContexts.length = 0
  })

  afterEach(() => {
    cleanup()
  })

  it('renders one labeled section per provider with see-all links', () => {
    mockUseSuspenseSearchSection.mockReturnValue(sectionData(2))

    render(<AllProvidersResults query="moon" />)

    const nasaSection = within(
      screen.getByRole('region', { name: 'NASA Image and Video Library' }),
    )
    const siSection = within(
      screen.getByRole('region', {
        name: 'Smithsonian National Air and Space Museum',
      }),
    )
    expect(
      nasaSection
        .getByRole('link', { name: 'See all from NASA' })
        .getAttribute('href'),
    ).toBe(`/search?providerId=${NASA_IVL_PROVIDER_ID}&q=moon`)
    expect(
      siSection
        .getByRole('link', { name: 'See all from Smithsonian' })
        .getAttribute('href'),
    ).toBe(`/search?providerId=${SI_OA_PROVIDER_ID}&q=moon`)
    expect(mockUseSuspenseSearchSection).toHaveBeenCalledWith('moon', {
      providerId: NASA_IVL_PROVIDER_ID,
      filters: {},
    })
    expect(mockUseSuspenseSearchSection).toHaveBeenCalledWith('moon', {
      providerId: SI_OA_PROVIDER_ID,
      filters: {},
    })
  })

  it('isolates a failing provider to its own section', () => {
    mockUseSuspenseSearchSection.mockImplementation(
      (_query: string, filters: SearchFilters) => {
        if (filters.providerId === NASA_IVL_PROVIDER_ID) {
          throw new Error('nasa upstream down')
        }
        return sectionData(3)
      },
    )

    render(<AllProvidersResults query="moon" />)

    expect(screen.getByRole('alert').textContent).toBe(
      "Couldn't load results from NASA Image and Video Library.",
    )
    const siSection = within(
      screen.getByRole('region', {
        name: 'Smithsonian National Air and Space Museum',
      }),
    )
    expect(siSection.getByTestId('asset-grid').textContent).toBe('3')
    // the boundary fallback can render more than once
    expect(capturedAlertContexts.length).toBeGreaterThan(0)
    for (const captureContext of capturedAlertContexts) {
      expect(captureContext).toEqual({
        boundaryKind: 'catch',
        feature: 'search',
        providerId: NASA_IVL_PROVIDER_ID,
        operation: 'load_search_section',
      })
    }
  })

  it('renders a per-section empty state', () => {
    mockUseSuspenseSearchSection.mockImplementation(
      (_query: string, filters: SearchFilters) =>
        filters.providerId === NASA_IVL_PROVIDER_ID
          ? sectionData(0)
          : sectionData(1),
    )

    render(<AllProvidersResults query="zzzz" />)

    expect(screen.getByText(/No matches for/).textContent).toBe(
      'No matches for zzzz in NASA Image and Video Library. Try a broader term.',
    )
  })

  it('labels see-all links and the empty-state cross-link with known totals', () => {
    mockUseSuspenseSearchSection.mockImplementation(
      (_query: string, filters: SearchFilters) =>
        filters.providerId === NASA_IVL_PROVIDER_ID
          ? sectionData(0)
          : sectionData(1),
    )
    mockUseSearchTotal.mockImplementation(
      (_query: string, filters: SearchFilters) =>
        filters.providerId === NASA_IVL_PROVIDER_ID ? 0 : 214,
    )

    render(<AllProvidersResults query="zzzz" />)

    const siSection = within(
      screen.getByRole('region', {
        name: 'Smithsonian National Air and Space Museum',
      }),
    )
    expect(siSection.getByRole('link', { name: 'See all 214' })).toBeTruthy()
    const crossLink = screen.getByRole('link', {
      name: 'see the 214 results from Smithsonian',
    })
    expect(crossLink.getAttribute('href')).toBe(
      `/search?providerId=${SI_OA_PROVIDER_ID}&q=zzzz`,
    )
  })
})
