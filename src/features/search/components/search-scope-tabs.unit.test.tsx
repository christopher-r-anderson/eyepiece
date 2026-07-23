import { createElement } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SearchScopeTabs } from './search-scope-tabs'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'
import { stringifySearchParams } from '@/lib/search-params'

vi.mock('@/components/ui/link', () => ({
  // plain anchor stand-in; e2e covers real link serialization
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

function scopeNav() {
  return within(screen.getByRole('navigation', { name: 'Search scope' }))
}

describe('search scope tabs', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a link per scope with the URL-derived current tab', () => {
    render(<SearchScopeTabs q="moon" scope={{ scope: 'all' }} />)

    const links = scopeNav().getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'All libraries',
      'NASA',
      'Smithsonian',
    ])
    expect(links[0]?.getAttribute('aria-current')).toBe('page')
    expect(links[1]?.getAttribute('aria-current')).toBeNull()
  })

  it('marks the provider tab current for a provider scope', () => {
    render(
      <SearchScopeTabs
        q="moon"
        scope={{
          scope: 'provider',
          filters: { providerId: SI_OA_PROVIDER_ID, filters: {} },
        }}
      />,
    )

    expect(
      scopeNav()
        .getByRole('link', { name: 'Smithsonian' })
        .getAttribute('aria-current'),
    ).toBe('page')
  })

  it('links provider scopes with the query preserved and filters reset', () => {
    render(
      <SearchScopeTabs
        q="moon"
        scope={{
          scope: 'provider',
          filters: {
            providerId: SI_OA_PROVIDER_ID,
            filters: {},
          },
        }}
      />,
    )

    expect(
      scopeNav().getByRole('link', { name: 'NASA' }).getAttribute('href'),
    ).toBe(`/search?providerId=${NASA_IVL_PROVIDER_ID}&q=moon`)
    expect(
      scopeNav()
        .getByRole('link', { name: 'All libraries' })
        .getAttribute('href'),
    ).toBe('/search?q=moon')
  })

  it('keeps active filters on the current tab link only', () => {
    render(
      <SearchScopeTabs
        q="moon"
        scope={{
          scope: 'provider',
          filters: {
            providerId: NASA_IVL_PROVIDER_ID,
            filters: { yearStart: 1990 },
          },
        }}
      />,
    )

    expect(
      scopeNav().getByRole('link', { name: 'NASA' }).getAttribute('href'),
    ).toBe(`/search?providerId=${NASA_IVL_PROVIDER_ID}&q=moon&yearStart=1990`)
  })

  it('omits an empty query from tab links', () => {
    render(<SearchScopeTabs q="" scope={{ scope: 'all' }} />)

    expect(
      scopeNav().getByRole('link', { name: 'NASA' }).getAttribute('href'),
    ).toBe(`/search?providerId=${NASA_IVL_PROVIDER_ID}`)
  })
})
