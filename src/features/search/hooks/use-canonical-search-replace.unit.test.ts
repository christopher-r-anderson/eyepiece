import { createElement } from 'react'
import { cleanup, render } from '@testing-library/react'
import {
  defaultParseSearch,
  defaultStringifySearch,
} from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'

const mockReplace = vi.fn()
let mockLocation = makeLocation('')

function makeLocation(searchStr: string, hash = '') {
  return {
    pathname: '/search',
    searchStr,
    search: defaultParseSearch(searchStr),
    hash,
  }
}

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return Object.assign({}, actual as object, {
    useRouter: () => ({ history: { replace: mockReplace } }),
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
  return `/search${defaultStringifySearch(search)}${hash}`
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
    expect(mockReplace).toHaveBeenCalledWith(canonicalHref({ q: 'moon' }))
  })

  it('does not replace a canonical URL', () => {
    mockLocation = makeLocation(
      defaultStringifySearch({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: 1990,
      }),
    )

    render(createElement(Harness))

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('normalizes param order to the canonical spelling', () => {
    mockLocation = makeLocation(`?providerId=${NASA_IVL_PROVIDER_ID}&q=moon`)

    render(createElement(Harness))

    expect(mockReplace).toHaveBeenCalledWith(
      canonicalHref({ q: 'moon', providerId: NASA_IVL_PROVIDER_ID }),
    )
  })

  it('strips an empty query', () => {
    mockLocation = makeLocation('?q=')

    render(createElement(Harness))

    expect(mockReplace).toHaveBeenCalledWith('/search')
  })

  it('preserves auth-modal params after the page params', () => {
    mockLocation = makeLocation('?auth=login&fp=1&q=moon&providerId=bogus')

    render(createElement(Harness))

    expect(mockReplace).toHaveBeenCalledWith(
      canonicalHref({ q: 'moon', auth: 'login', fp: 1 }),
    )
  })

  it('does not replace when auth params are already in app-emitted order', () => {
    mockLocation = makeLocation(
      defaultStringifySearch({ q: 'moon', auth: 'login' }),
    )

    render(createElement(Harness))

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('preserves the hash through a replace', () => {
    mockLocation = makeLocation('?providerId=bogus&q=moon', 'results')

    render(createElement(Harness))

    expect(mockReplace).toHaveBeenCalledWith(
      canonicalHref({ q: 'moon' }, '#results'),
    )
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
