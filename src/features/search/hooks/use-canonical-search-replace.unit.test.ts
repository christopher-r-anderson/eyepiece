import { createElement } from 'react'
import { cleanup, render } from '@testing-library/react'
import { defaultParseSearch } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { stringifySearchParams } from '@/lib/search-params'

const mockReplace = vi.fn()
// a replace must carry the entry's state (dialogPushed etc.), not rebuild it
const mockState = { key: 'k1', dialogPushed: true }
let mockHistoryHref = '/search'
let mockLocation = makeLocation('')

function makeLocation(
  searchStr: string,
  hash = '',
): {
  pathname: string
  search: unknown
  hash: string
  state: typeof mockState
  maskedLocation?: { href: string }
} {
  // the hook compares against the history's own href (synchronous,
  // pending writes included), never window.location or the router state
  mockHistoryHref = `/search${searchStr}${hash ? `#${hash}` : ''}`
  return {
    pathname: '/search',
    search: defaultParseSearch(searchStr),
    hash,
    state: mockState,
  }
}

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return Object.assign({}, actual as object, {
    useRouter: () => ({
      history: {
        replace: mockReplace,
        get location() {
          return { href: mockHistoryHref }
        },
      },
    }),
    useRouterState: ({
      select,
    }: {
      select: (state: { location: unknown }) => unknown
    }) => select({ location: mockLocation }),
  })
})

const { useCanonicalSearchReplace } =
  await import('./use-canonical-search-replace')

function Harness() {
  useCanonicalSearchReplace()
  return null
}

function canonicalHref(search: Record<string, unknown>, hash = '') {
  return `/search${stringifySearchParams(search)}${hash}`
}

describe('useCanonicalSearchReplace', () => {
  beforeEach(() => {
    mockReplace.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('replaces a junk URL with its canonical form', () => {
    mockLocation = makeLocation(
      '?q=moon&providerId=bogus&utm_source=newsletter',
    )

    render(createElement(Harness))

    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith(
      canonicalHref({ q: 'moon' }),
      mockState,
    )
  })

  it('does not replace a canonical URL', () => {
    mockLocation = makeLocation(
      stringifySearchParams({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: 1990,
      }),
    )

    render(createElement(Harness))

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('normalizes param order to the sorted canonical spelling', () => {
    mockLocation = makeLocation(`?q=moon&providerId=${NASA_IVL_PROVIDER_ID}`)

    render(createElement(Harness))

    expect(mockReplace).toHaveBeenCalledWith(
      canonicalHref({ q: 'moon', providerId: NASA_IVL_PROVIDER_ID }),
      mockState,
    )
  })

  it.each([['?q='], ['?q=%20%20']])(
    'strips an empty or whitespace-only query %s',
    (searchStr) => {
      mockLocation = makeLocation(searchStr)

      render(createElement(Harness))

      expect(mockReplace).toHaveBeenCalledWith('/search', mockState)
    },
  )

  it('drops legacy auth-modal params as junk', () => {
    mockLocation = makeLocation('?auth=login&fp=1&q=moon&providerId=bogus')

    render(createElement(Harness))

    expect(mockReplace).toHaveBeenCalledWith(
      canonicalHref({ q: 'moon' }),
      mockState,
    )
  })

  it('preserves the hash through a replace', () => {
    mockLocation = makeLocation('?providerId=bogus&q=moon', 'results')

    render(createElement(Harness))

    expect(mockReplace).toHaveBeenCalledWith(
      canonicalHref({ q: 'moon' }, '#results'),
      mockState,
    )
  })

  it('ignores a lagging window.location', () => {
    // the browser history defers DOM writes by a microtask, so during a
    // warm-cache navigation commit window.location still shows the
    // previous entry; reading it fired a replace loop (max update depth)
    mockLocation = makeLocation(stringifySearchParams({ q: 'moon' }))
    window.history.replaceState(null, '', '/search?q=previous')

    render(createElement(Harness))

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('stands down while a masked location is displayed', () => {
    // an open asset overlay masks the URL; replacing would tear it down
    mockLocation = {
      ...makeLocation('?providerId=bogus&q=moon'),
      maskedLocation: { href: '/assets/nasa_ivl/x' },
    }

    render(createElement(Harness))

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('is a fixed point: the replaced URL does not replace again', () => {
    mockLocation = makeLocation('?providerId=bogus&q=moon&utm_source=x')
    render(createElement(Harness))
    const [replacedHref] = mockReplace.mock.calls[0] as [string]
    cleanup()
    mockReplace.mockReset()

    const [pathAndSearch = ''] = replacedHref.split('#')
    mockLocation = makeLocation(pathAndSearch.replace('/search', ''))
    render(createElement(Harness))

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
