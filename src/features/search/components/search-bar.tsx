import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { toSearchPageParams } from '../search-page-params'
import { SearchInput } from './search-bar/search-input'
import type { FormProps } from '@/components/ui/forms'
import type { SearchScope } from '../search-page-params'
import type { NasaIvlSearchFilters } from '@/domain/search/providers/nasa-ivl-filters'
import { Form } from '@/components/ui/forms'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'

interface SearchBarProps extends FormProps {
  initialQuery: string
  scope: SearchScope
  // the year inputs live in the conditions line and associate through the
  // form attribute; hydrated submits read this lifted state
  nasaFilters?: NasaIvlSearchFilters
}

function HiddenScopeFields({ fields }: { fields: Array<[string, unknown]> }) {
  return fields.map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={String(value)} />
  ))
}

export function SearchBar({
  initialQuery,
  scope,
  nasaFilters,
  css: styles,
  ...props
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const isNasaScope =
    scope.scope === 'provider' &&
    scope.filters.providerId === NASA_IVL_PROVIDER_ID
  const navigate = useNavigate()

  // before hydration the form submits natively and serializes in document
  // order, so the initial scope rides along as hidden fields sorted and
  // split around the q input to produce the router's key-sorted spelling.
  // the year filters are real named inputs in the conditions line, not
  // hidden fields; a native submit carrying them serializes non-canonical
  // and relies on the canonicalization redirect
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
        filters: {
          providerId: NASA_IVL_PROVIDER_ID,
          filters: nasaFilters ?? {},
        },
      }
    }
    return scope
  }

  return (
    <Form
      action="/search"
      css={css.raw(
        { width: '100%', maxWidth: 'formMax', padding: 0, marginInline: 0 },
        styles,
      )}
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
      <SearchInput
        aria-label="Search keywords"
        value={query}
        onChange={setQuery}
      />
      <HiddenScopeFields fields={fieldsAfterQuery} />
    </Form>
  )
}
