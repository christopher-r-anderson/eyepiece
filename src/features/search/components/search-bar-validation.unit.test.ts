import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchBar } from './search-bar'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return Object.assign({}, actual as object, {
    useNavigate: () => mockNavigate,
  })
})

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
      createElement(SearchBar, {
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

  it('renders the year filters as named inputs with cross-wired bounds', () => {
    render(
      createElement(SearchBar, {
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

    const from = screen.getByLabelText<HTMLInputElement>('From')
    expect(from.name).toBe('yearStart')
    expect(from.value).toBe('1990')
    expect(from.getAttribute('max')).toBe('2000')

    const to = screen.getByLabelText<HTMLInputElement>('To')
    expect(to.name).toBe('yearEnd')
    expect(to.value).toBe('2000')
    expect(to.getAttribute('min')).toBe('1990')
  })

  it('submits an edited year input through the router navigate', () => {
    render(
      createElement(SearchBar, {
        initialQuery: 'apollo',
        scope: {
          scope: 'provider',
          filters: { providerId: NASA_IVL_PROVIDER_ID, filters: {} },
        },
      }),
    )

    fireEvent.change(screen.getByLabelText('From'), {
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

  it('renders the filters panel only for the NASA scope', () => {
    const { unmount } = render(
      createElement(SearchBar, {
        initialQuery: '',
        scope: {
          scope: 'provider',
          filters: { providerId: NASA_IVL_PROVIDER_ID, filters: {} },
        },
      }),
    )

    expect(screen.getByText('Year Range')).toBeTruthy()
    unmount()

    render(
      createElement(SearchBar, {
        initialQuery: '',
        scope: {
          scope: 'provider',
          filters: { providerId: SI_OA_PROVIDER_ID, filters: {} },
        },
      }),
    )

    expect(screen.queryByText('Year Range')).toBeNull()
  })
})
