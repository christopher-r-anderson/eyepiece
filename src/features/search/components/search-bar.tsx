import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useId } from 'react-aria'
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

const SEARCH_VALIDATION_MESSAGE = 'Enter search keywords before searching.'

interface SearchBarProps extends FormProps {
  initialQuery: string
  scope: SearchScope
}

export function SearchBar({
  initialQuery,
  scope,
  css: styles,
  ...props
}: SearchBarProps) {
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
      css={css.raw({ width: '100%' }, styles)}
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
          className={css({
            color: 'danger.text',
            fontSize: 'sm',
          })}
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

function FiltersPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={css({
        marginTop: '2',
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
