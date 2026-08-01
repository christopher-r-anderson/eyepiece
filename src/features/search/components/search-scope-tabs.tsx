import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { toCanonicalUrlParams, toSearchPageParams } from '../search-page-params'
import type { SearchPageParams, SearchScope } from '../search-page-params'
import { Link } from '@/components/ui/link'
import { PROVIDERS, PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'

const ALL_SCOPE_KEY = 'all'

interface SearchScopeTabsProps {
  q: string
  scope: SearchScope
}

// matches the tabs recipe's underline look without sharing its styles
const scopeTabCss = css.raw({
  fontSize: 'control',
  textTransform: 'lowercase',
  color: 'text.muted',
  textDecoration: 'none',
  flexShrink: 0,
  paddingBlock: '1',
  borderBottom: '1px solid transparent',
  transitionFast: 'color, border-color',
  _hovered: {
    color: 'text',
    textDecoration: 'none',
  },
  '&[aria-current="page"]': {
    color: 'text',
    borderBottomColor: 'accent',
  },
  _focusVisible: {
    outlineOffset: '2px',
  },
})

export function SearchScopeTabs({ q, scope }: SearchScopeTabsProps) {
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
    <nav
      aria-label="Search scope"
      className={flex({
        alignItems: 'center',
        gap: '5',
        overflowX: 'auto',
        scrollbarThin: true,
        whiteSpace: 'nowrap',
        // the scroll container clips focus rings; pad the scrollport and
        // pull the box back so the layout position holds
        padding: '1',
        margin: '-1',
      })}
    >
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
            activeOptions={{ exact: true }}
            css={scopeTabCss}
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
  )
}
