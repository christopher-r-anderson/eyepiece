import { Link } from '@tanstack/react-router'
import { toCanonicalUrlParams, toSearchPageParams } from '../search-page-params'
import type { SearchPageParams, SearchScope } from '../search-page-params'
import { PROVIDERS, PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'

// Links styled as tabs (visuals match src/components/ui/tabs.tsx), on
// purpose not ARIA tabs: scope changes are navigations, and react-aria
// collection components break SSR hydration here (Emotion style tags inside
// their <template>). See docs/Search.md.
const tabListCss = {
  display: 'flex' as const,
  flexWrap: 'wrap' as const,
  gap: 'var(--space-2)',
  alignItems: 'end' as const,
  marginBottom: '-1px',
}

const tabLinkCss = {
  minHeight: 'var(--size-control-height)',
  padding: 'var(--space-2) var(--space-4)',
  border: '1px solid var(--border-color)',
  borderBottomWidth: 0,
  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
  backgroundColor: 'var(--secondary-bg)',
  color: 'var(--secondary-text)',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  outline: 'none',
  textDecoration: 'none',
  transition:
    'background-color var(--transition-fast), color var(--transition-fast)',
  '&[aria-current="page"]': {
    fontWeight: 'bold',
    backgroundColor: 'var(--tertiary-bg)',
    position: 'relative' as const,
    zIndex: 1,
  },
  '&:focus-visible': {
    outline: '1px solid var(--outline-color)',
  },
}

const tabPanelCss = {
  backgroundColor: 'var(--tertiary-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '0 var(--radius-lg) var(--radius-lg) var(--radius-lg)',
  padding: 'var(--space-4)',
}

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
    <div css={{ display: 'grid', gap: 0, width: '100%' }}>
      <nav aria-label="Search scope" css={tabListCss}>
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
      <div css={tabPanelCss}>{children}</div>
    </div>
  )
}
