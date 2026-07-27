import { useState } from 'react'
import { useHydrated, useNavigate } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import {
  searchPageParamsSchema,
  toSearchPageParams,
  toSearchPageState,
} from '../search-page-params'
import { SearchInput } from './search-bar/search-input'
import type { FormProps } from '@/components/ui/forms'
import type { SearchScope } from '../search-page-params'
import { Form } from '@/components/ui/forms'

// the single site search form; the search page's year inputs associate
// with it through the form attribute
export const SEARCH_FORM_ID = 'site-search-form'

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
  const navigate = useNavigate()

  // RAC keeps the q input controlled, so hydration's first commit resets it
  // and wipes keystrokes typed before it; while hydrating, seed from the
  // live DOM value instead (the q input is unique page-wide)
  const isHydrating = !useHydrated()
  const [seedQuery] = useState(() =>
    isHydrating && typeof document !== 'undefined'
      ? (document.querySelector<HTMLInputElement>('input[name="q"]')?.value ??
        initialQuery)
      : initialQuery,
  )

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

  return (
    <Form
      action="/search"
      css={css.raw(
        { width: '100%', maxWidth: 'formMax', padding: 0, marginInline: 0 },
        styles,
      )}
      onSubmit={(event) => {
        event.preventDefault()
        // the form is the source of truth for a hydrated submit too: the
        // query, hidden scope fields, and form-associated year inputs all
        // arrive through FormData and take the same lenient parse as a URL
        const state = toSearchPageState(
          searchPageParamsSchema.parse(
            Object.fromEntries(new FormData(event.currentTarget)),
          ),
        )
        void navigate({
          to: '/search',
          search: toSearchPageParams(state.q, state.scope),
        })
      }}
      {...props}
    >
      <HiddenScopeFields fields={fieldsBeforeQuery} />
      <SearchInput aria-label="Search keywords" defaultValue={seedQuery} />
      <HiddenScopeFields fields={fieldsAfterQuery} />
    </Form>
  )
}
