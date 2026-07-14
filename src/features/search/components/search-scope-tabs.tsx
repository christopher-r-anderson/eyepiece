import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { toCanonicalUrlParams, toSearchPageParams } from '../search-page-params'
import type { SearchPageParams, SearchScope } from '../search-page-params'
import { Link } from '@/components/ui/link'
import { tabListStyles, tabPanelStyles, tabStyles } from '@/components/ui/tabs'
import { PROVIDERS, PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'

// Links styled as tabs (shared visuals from @/components/ui/tabs), on
// purpose not ARIA tabs: scope changes are navigations. See docs/Search.md.
// the selected state duplicates tabStyles._selected under [aria-current]
// because links get aria-current, not react aria's data-selected
const tabLinkCss = css.raw(tabStyles, {
  textDecoration: 'none',
  _hovered: {
    textDecoration: 'none',
  },
  '&[aria-current="page"]': {
    fontWeight: 'bold',
    backgroundColor: 'tertiary.bg',
    position: 'relative',
    zIndex: 1,
  },
  _focusVisible: {
    outlineOffset: 0,
  },
})

const ALL_SCOPE_KEY = 'all'

interface SearchScopeTabsProps {
  q: string
  scope: SearchScope
  children: React.ReactNode
}

export function SearchScopeTabs({ q, scope, children }: SearchScopeTabsProps) {
  const selectedKey =
    scope.scope === 'all' ? ALL_SCOPE_KEY : scope.filters.providerId

  const scopeTabs = [
    { key: ALL_SCOPE_KEY, label: 'All libraries', scope: { scope: 'all' } },
    ...PROVIDERS.map((providerId) => ({
      key: providerId,
      label: PROVIDER_DISPLAY[providerId].shortLabel,
      scope: {
        scope: 'provider' as const,
        filters: { providerId, filters: {} },
      },
    })),
  ] satisfies Array<{ key: string; label: string; scope: SearchScope }>

  return (
    <div className={grid({ gap: 0, width: '100%' })}>
      <nav aria-label="Search scope" className={css(tabListStyles)}>
        {scopeTabs.map((tab) => {
          const isCurrent = tab.key === selectedKey
          return (
            <Link
              key={tab.key}
              to="/search"
              // current tab keeps its filters, switching resets them;
              // cast: canonical params may omit an empty q
              search={
                toCanonicalUrlParams(
                  toSearchPageParams(q, isCurrent ? scope : tab.scope),
                ) as SearchPageParams
              }
              aria-current={isCurrent ? 'page' : undefined}
              css={tabLinkCss}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <div className={css(tabPanelStyles)}>{children}</div>
    </div>
  )
}
