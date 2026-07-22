import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { toSearchPageParams } from '../search-page-params'
import { SearchInput } from './search-bar/search-input'
import { SubmitButton } from './search-bar/submit-button'
import { NasaIvlFilters } from './providers/nasa-ivl-filters'
import type { FormProps } from '@/components/ui/forms'
import type { SearchScope } from '../search-page-params'
import type { NasaIvlSearchFilters } from '@/domain/search/providers/nasa-ivl-filters'
import { Form } from '@/components/ui/forms'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'

interface SearchBarProps extends FormProps {
  initialQuery: string
  scope: SearchScope
}

function HiddenScopeFields({ fields }: { fields: Array<[string, unknown]> }) {
  return fields.map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={String(value)} />
  ))
}

export function SearchBar({
  initialQuery,
  scope,
  css: styles,
  ...props
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const isNasaScope =
    scope.scope === 'provider' &&
    scope.filters.providerId === NASA_IVL_PROVIDER_ID
  const [nasaFilters, setNasaFilters] = useState<NasaIvlSearchFilters>(
    isNasaScope ? scope.filters.filters : {},
  )
  const navigate = useNavigate()

  // before hydration the form submits natively and serializes in document
  // order, so the initial scope rides along as hidden fields sorted and
  // split around the q input to produce the router's key-sorted spelling.
  // the year filters are real named inputs in the panel below, not hidden
  // fields; a native submit carrying them serializes non-canonical and
  // relies on the canonicalization redirect
  const nativeInputNames = ['q', 'yearStart', 'yearEnd']
  const nativeScopeFields = Object.entries(
    toSearchPageParams(initialQuery, scope),
  )
    .filter(([name]) => !nativeInputNames.includes(name))
    .sort(([a], [b]) => (a < b ? -1 : 1))
  const fieldsBeforeQuery = nativeScopeFields.filter(([name]) => name < 'q')
  const fieldsAfterQuery = nativeScopeFields.filter(([name]) => name > 'q')

  function submitScope(): SearchScope {
    if (isNasaScope) {
      return {
        scope: 'provider',
        filters: { providerId: NASA_IVL_PROVIDER_ID, filters: nasaFilters },
      }
    }
    return scope
  }

  return (
    <Form
      action="/search"
      css={css.raw({ width: '100%' }, styles)}
      onSubmit={(event) => {
        event.preventDefault()
        void navigate({
          to: '/search',
          search: toSearchPageParams(query, submitScope()),
        })
      }}
      {...props}
    >
      <HiddenScopeFields fields={fieldsBeforeQuery} />
      <div
        className={grid({
          background: 'secondary.bg',
          color: 'secondary.text',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '2',
          alignItems: 'stretch',
          padding: '2',
          borderRadius: 'md',
          border: 'default',
          boxShadow: 'sm',
          '@/xl': {
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: '4',
            alignItems: 'center',
          },
        })}
      >
        <SearchInput
          aria-label="Search keywords"
          value={query}
          onChange={setQuery}
        />
        <SubmitButton />
      </div>
      <HiddenScopeFields fields={fieldsAfterQuery} />
      {isNasaScope && (
        <FiltersPanel>
          <NasaIvlFilters filters={nasaFilters} onChange={setNasaFilters} />
        </FiltersPanel>
      )}
    </Form>
  )
}

function FiltersPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={css({
        padding: '4',
        background: 'secondary.bg',
        color: 'secondary.text',
        borderRadius: 'md',
        border: 'default',
        boxShadow: 'sm',
        overflowX: 'auto',
      })}
    >
      {children}
    </div>
  )
}
