import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { toCanonicalUrlParams, toSearchPageParams } from '../search-page-params'
import type { SearchPageParams, SearchScope } from '../search-page-params'
import { Link } from '@/components/ui/link'
import { tabListStyles, tabPanelStyles } from '@/components/ui/tab.styles'
import { PROVIDERS, PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'

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
              // links, not ARIA tabs, on purpose: scope changes are
              // navigations (see docs/Search.md). exact keeps the router
              // from also marking the All tab active on provider scopes
              // (its search params are a subset of theirs)
              variant="tab"
              activeOptions={{ exact: true }}
              // current tab keeps its filters, switching resets them;
              // cast: canonical params may omit an empty q
              search={
                toCanonicalUrlParams(
                  toSearchPageParams(q, isCurrent ? scope : tab.scope),
                ) as SearchPageParams
              }
              aria-current={isCurrent ? 'page' : undefined}
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
