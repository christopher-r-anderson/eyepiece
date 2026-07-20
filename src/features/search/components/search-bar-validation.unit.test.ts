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

  it('shows the validation alert on a whitespace-only submit', () => {
    render(
      createElement(SearchBar, { initialQuery: '', scope: { scope: 'all' } }),
    )

    typeQuery('   ')
    submit()

    expect(screen.getByRole('alert').textContent).toContain(
      'Enter search keywords before searching.',
    )
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
            filters: { mediaType: 'image', yearStart: 1990 },
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
        mediaType: 'image',
        yearStart: 1990,
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

    expect(screen.getByText('Media Type')).toBeTruthy()
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

    expect(screen.queryByText('Media Type')).toBeNull()
  })
})
