import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { toSearchPageParams } from '../search-page-params'
import { SearchInput } from './search-bar/search-input'
import { SubmitButton } from './search-bar/submit-button'
import { NasaIvlFilters } from './providers/nasa-ivl-filters'
import type { FormProps } from '@/components/ui/forms'
import type { SearchScope } from '../search-page-params'
import type { NasaIvlSearchFilters } from '@/domain/search/providers/nasa-ivl-filters'
import { Form } from '@/components/ui/forms'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'

const searchValidationMessageCss = css.raw({
  color: 'danger.text',
  fontSize: 'sm',
})

const SEARCH_VALIDATION_MESSAGE = 'Enter search keywords before searching.'

interface SearchBarProps extends FormProps {
  initialQuery: string
  scope: SearchScope
}

export function SearchBar({ initialQuery, scope, ...props }: SearchBarProps) {
  const validationMessageId = useId()
  const [query, setQuery] = useState(initialQuery)
  const isNasaScope =
    scope.scope === 'provider' &&
    scope.filters.providerId === NASA_IVL_PROVIDER_ID
  const [nasaFilters, setNasaFilters] = useState<NasaIvlSearchFilters>(
    isNasaScope ? scope.filters.filters : {},
  )
  const [showValidationMessage, setShowValidationMessage] = useState(false)
  const navigate = useNavigate()
  const isValid = query.trim().length > 0

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery)

    if (nextQuery.trim().length > 0) {
      setShowValidationMessage(false)
    }
  }

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
      aria-describedby={showValidationMessage ? validationMessageId : undefined}
      styles={css.raw({ width: '100%' })}
      onSubmit={(event) => {
        event.preventDefault()
        if (!isValid) {
          setShowValidationMessage(true)
          return
        }

        setShowValidationMessage(false)
        void navigate({
          to: '/search',
          search: toSearchPageParams(query, submitScope()),
        })
      }}
      {...props}
    >
      <div
        className={css({
          background: 'secondary.bg',
          color: 'secondary.text',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '2',
          alignItems: 'stretch',
          padding: '2',
          borderRadius: 'md',
          border: '1px solid token(colors.border)',
          boxShadow: 'sm',
          _searchBarInline: {
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: '4',
            alignItems: 'center',
          },
        })}
      >
        <SearchInput
          aria-label="Search keywords"
          aria-describedby={
            showValidationMessage ? validationMessageId : undefined
          }
          aria-invalid={showValidationMessage || undefined}
          value={query}
          onChange={updateQuery}
        />
        <SubmitButton />
      </div>
      {showValidationMessage && (
        <p
          id={validationMessageId}
          role="alert"
          className={css(searchValidationMessageCss)}
        >
          {SEARCH_VALIDATION_MESSAGE}
        </p>
      )}
      {isNasaScope && (
        <FiltersPanel>
          <NasaIvlFilters filters={nasaFilters} onChange={setNasaFilters} />
        </FiltersPanel>
      )}
    </Form>
  )
}

const filtersPanelCss = css.raw({
  marginTop: '2',
  padding: '4',
  background: 'secondary.bg',
  color: 'secondary.text',
  borderRadius: 'md',
  border: '1px solid token(colors.border)',
  boxShadow: 'sm',
  overflowX: 'auto',
})

function FiltersPanel({ children }: { children: React.ReactNode }) {
  return <div className={css(filtersPanelCss)}>{children}</div>
}
