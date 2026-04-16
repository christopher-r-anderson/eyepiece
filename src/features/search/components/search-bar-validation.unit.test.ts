import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnyProviderSearchBar, SelectedProviderSearchBar } from './search-bar'
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

describe('search bar validation', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('keeps homepage provider buttons focusable and shows a validation alert on attempted search', () => {
    render(createElement(AnyProviderSearchBar))

    const nasaButton = screen.getByRole('button', {
      name: 'NASA Image and Video Library',
    })

    expect(nasaButton.hasAttribute('disabled')).toBe(false)

    fireEvent.click(nasaButton)

    expect(screen.getByRole('alert').textContent).toContain(
      'Enter search keywords before choosing a library.',
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates from the homepage provider buttons once a query is entered', () => {
    render(createElement(AnyProviderSearchBar))

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search keywords' }),
      {
        target: { value: 'apollo' },
      },
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'NASA Image and Video Library',
      }),
    )

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/search',
      search: {
        q: 'apollo',
        providerId: NASA_IVL_PROVIDER_ID,
        filters: {},
      },
    })
  })

  it('shows a validation alert on empty selected-provider submit and keeps the submit button enabled', () => {
    render(
      createElement(SelectedProviderSearchBar, {
        initialQuery: '',
        initialFilters: { providerId: SI_OA_PROVIDER_ID, filters: {} },
      }),
    )

    const submitButton = screen.getByRole('button', { name: 'Search' })
    expect(submitButton.hasAttribute('disabled')).toBe(false)

    fireEvent.click(submitButton)

    expect(screen.getByRole('alert').textContent).toContain(
      'Enter search keywords before searching.',
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
