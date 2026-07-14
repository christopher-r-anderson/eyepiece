import { css } from 'styled-system/css'
import { toCanonicalUrlParams, toSearchPageParams } from '../search-page-params'
import type { SearchPageParams, SearchScope } from '../search-page-params'
import { Link } from '@/components/ui/link'
import { PROVIDERS, PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'

// Links styled as tabs (visuals match src/components/ui/tabs.tsx), on
// purpose not ARIA tabs: scope changes are navigations, and react-aria
// collection components break SSR hydration here (Emotion style tags inside
// their <template>). See docs/Search.md.
const tabListCss = css.raw({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  alignItems: 'end',
  marginBottom: '-1px',
})

const tabLinkCss = css.raw({
  minHeight: 'controlHeight',
  paddingBlock: '2',
  paddingInline: '4',
  border: '1px solid token(colors.border)',
  borderBottomWidth: 0,
  borderRadius: 'token(radii.md) token(radii.md) 0 0',
  backgroundColor: 'secondary.bg',
  color: 'secondary.text',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  outline: 'none',
  textDecoration: 'none',
  transitionProperty: 'background-color, color',
  transitionDuration: 'fast',
  transitionTimingFunction: 'default',
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
    outline: '1px solid token(colors.outline)',
    outlineOffset: 0,
  },
})

const tabPanelCss = css.raw({
  backgroundColor: 'tertiary.bg',
  border: '1px solid token(colors.border)',
  borderRadius: '0 token(radii.lg) token(radii.lg) token(radii.lg)',
  padding: '4',
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
    <div className={css({ display: 'grid', gap: 0, width: '100%' })}>
      <nav aria-label="Search scope" className={css(tabListCss)}>
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
              styles={tabLinkCss}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <div className={css(tabPanelCss)}>{children}</div>
    </div>
  )
}
