import { Fragment, createElement, useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchBar } from './search-bar'
import { SearchConditions } from './search-conditions'
import type { SearchScope } from '../search-page-params'
import type { NasaIvlSearchFilters } from '@/domain/search/providers/nasa-ivl-filters'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'
import { YEAR_MAX, YEAR_MIN } from '@/domain/search/providers/nasa-ivl-filters'

vi.mock('../search.queries', () => ({
  useSearchTotal: () => undefined,
}))

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return Object.assign({}, actual as object, {
    useNavigate: () => mockNavigate,
  })
})

// mirrors the page wiring: the year inputs render in the conditions line
// and associate with the form through the form attribute
function SearchHarness({
  initialQuery,
  scope,
}: {
  initialQuery: string
  scope: SearchScope
}) {
  const isNasaScope =
    scope.scope === 'provider' &&
    scope.filters.providerId === NASA_IVL_PROVIDER_ID
  const [nasaFilters, setNasaFilters] = useState<NasaIvlSearchFilters>(
    isNasaScope ? scope.filters.filters : {},
  )
  return createElement(
    Fragment,
    null,
    createElement(SearchBar, {
      id: 'search-form',
      initialQuery,
      scope,
      nasaFilters,
    }),
    createElement(SearchConditions, {
      q: initialQuery,
      scope,
      formId: 'search-form',
      nasaFilters,
      onNasaFiltersChange: setNasaFilters,
      onNasaFiltersCommit: () => {},
    }),
  )
}

function typeQuery(value: string) {
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search keywords' }), {
    target: { value },
  })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Search' }))
}

describe('search bar', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the field error on empty submit and keeps the submit button enabled', () => {
    render(
      createElement(SearchBar, { initialQuery: '', scope: { scope: 'all' } }),
    )

    const submitButton = screen.getByRole('button', { name: 'Search' })
    expect(submitButton.hasAttribute('disabled')).toBe(false)

    submit()

    expect(screen.getByText('Please enter valid search keywords.')).toBeTruthy()
    expect(
      screen
        .getByRole('searchbox', { name: 'Search keywords' })
        .getAttribute('aria-invalid'),
    ).toBe('true')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows the field error on a whitespace-only submit', () => {
    render(
      createElement(SearchBar, { initialQuery: '', scope: { scope: 'all' } }),
    )

    typeQuery('   ')
    submit()

    expect(screen.getByText('Please enter valid search keywords.')).toBeTruthy()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates with only the query in the all scope', () => {
    render(
      createElement(SearchBar, { initialQuery: '', scope: { scope: 'all' } }),
    )

    typeQuery('apollo')
    submit()

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/search',
      search: { q: 'apollo' },
    })
  })

  it('navigates with flat provider filters in the NASA scope', () => {
    render(
      createElement(SearchHarness, {
        initialQuery: 'apollo',
        scope: {
          scope: 'provider',
          filters: {
            providerId: NASA_IVL_PROVIDER_ID,
            filters: { yearStart: 1990 },
          },
        },
      }),
    )

    submit()

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/search',
      search: {
        q: 'apollo',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: 1990,
      },
    })
  })

  it('renders the year filters as form-associated named inputs with full-range bounds', () => {
    render(
      createElement(SearchHarness, {
        initialQuery: 'apollo',
        scope: {
          scope: 'provider',
          filters: {
            providerId: NASA_IVL_PROVIDER_ID,
            filters: { yearStart: 1990, yearEnd: 2000 },
          },
        },
      }),
    )

    const from = screen.getByLabelText<HTMLInputElement>('Earliest year')
    expect(from.name).toBe('yearStart')
    expect(from.value).toBe('1990')
    expect(from.getAttribute('max')).toBe(String(YEAR_MAX))
    expect(from.getAttribute('form')).toBe('search-form')

    const to = screen.getByLabelText<HTMLInputElement>('Latest year')
    expect(to.name).toBe('yearEnd')
    expect(to.value).toBe('2000')
    expect(to.getAttribute('min')).toBe(String(YEAR_MIN))
    expect(to.getAttribute('form')).toBe('search-form')
  })

  it('cross-wires the year bounds after an edit', () => {
    render(
      createElement(SearchHarness, {
        initialQuery: 'apollo',
        scope: {
          scope: 'provider',
          filters: {
            providerId: NASA_IVL_PROVIDER_ID,
            filters: { yearStart: 1990, yearEnd: 2000 },
          },
        },
      }),
    )

    fireEvent.change(screen.getByLabelText('Earliest year'), {
      target: { value: '1995' },
    })

    expect(
      screen
        .getByLabelText<HTMLInputElement>('Earliest year')
        .getAttribute('max'),
    ).toBe('2000')
    expect(
      screen
        .getByLabelText<HTMLInputElement>('Latest year')
        .getAttribute('min'),
    ).toBe('1995')
  })

  it('submits an edited year input through the router navigate', () => {
    render(
      createElement(SearchHarness, {
        initialQuery: 'apollo',
        scope: {
          scope: 'provider',
          filters: { providerId: NASA_IVL_PROVIDER_ID, filters: {} },
        },
      }),
    )

    fireEvent.change(screen.getByLabelText('Earliest year'), {
      target: { value: '1995' },
    })
    submit()

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/search',
      search: {
        q: 'apollo',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: 1995,
      },
    })
  })

  it('renders the year inputs only for the NASA scope', () => {
    const { unmount } = render(
      createElement(SearchHarness, {
        initialQuery: '',
        scope: {
          scope: 'provider',
          filters: { providerId: NASA_IVL_PROVIDER_ID, filters: {} },
        },
      }),
    )

    expect(screen.getByLabelText('Earliest year')).toBeTruthy()
    unmount()

    render(
      createElement(SearchHarness, {
        initialQuery: '',
        scope: {
          scope: 'provider',
          filters: { providerId: SI_OA_PROVIDER_ID, filters: {} },
        },
      }),
    )

    expect(screen.queryByLabelText('Earliest year')).toBeNull()
  })
})
