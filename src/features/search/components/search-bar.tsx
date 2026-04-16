import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useId } from 'react-aria'
import { COMPACT_LAYOUT_MIN_WIDTH } from '../../../lib/breakpoints'
import { SearchInput } from './search-bar/search-input'
import { ProviderButton } from './search-bar/provider-button'
import { SubmitButton } from './search-bar/submit-button'
import { NasaIvlFilters } from './providers/nasa-ivl-filters'
import type { FormProps } from '@/components/ui/forms'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import { Form, Label } from '@/components/ui/forms'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
  providerIdSchema,
} from '@/domain/provider/provider.schema'
import { Select } from '@/components/ui/select'
import { getIdProp, getLabelProp } from '@/components/ui/select.utils'
import { VisuallyHidden } from '@/components/ui/a11y'

const SELECTED_PROVIDER_INLINE_MIN_WIDTH = '34rem'
const searchValidationMessageCss = {
  color: 'var(--danger-text)',
  fontSize: 'var(--text-sm)',
}

const ANY_PROVIDER_HELP_TEXT =
  'Use either of the search buttons to pick your library.'
const ANY_PROVIDER_VALIDATION_MESSAGE =
  'Enter search keywords before choosing a library.'
const SELECTED_PROVIDER_VALIDATION_MESSAGE =
  'Enter search keywords before searching.'

function searchParams(
  query: SearchQuery,
  filters: SearchFilters,
): SearchFilters & { q: SearchQuery } {
  return {
    ...filters,
    q: query,
  }
}

interface AnyProviderSearchBarProps extends FormProps {
  initialQuery?: string
}

export function AnyProviderSearchBar({
  initialQuery = '',
  ...props
}: AnyProviderSearchBarProps) {
  const helperTextId = useId()
  const validationMessageId = useId()
  const [query, setQuery] = useState(initialQuery)
  const [showValidationMessage, setShowValidationMessage] = useState(false)
  const nasaButtonRef = useRef<HTMLButtonElement | null>(null)
  const sioaButtonRef = useRef<HTMLButtonElement | null>(null)
  const navigate = useNavigate()
  const isValid = query.trim().length > 0
  const describedBy = showValidationMessage
    ? `${helperTextId} ${validationMessageId}`
    : helperTextId

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery)

    if (nextQuery.trim().length > 0) {
      setShowValidationMessage(false)
    }
  }

  function showValidation() {
    setShowValidationMessage(true)
  }

  function handleProviderKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    provider: ProviderId,
  ) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()

      if (provider === NASA_IVL_PROVIDER_ID) {
        sioaButtonRef.current?.focus()
      } else {
        nasaButtonRef.current?.focus()
      }
    }
  }
  function runSearch(providerId: ProviderId) {
    if (!isValid) {
      showValidation()
      return
    }

    setShowValidationMessage(false)
    navigate({
      to: '/search',
      search: searchParams(query, { providerId, filters: {} }),
    })
  }
  return (
    <Form
      aria-describedby={describedBy}
      css={{ width: '100%' }}
      onSubmit={(event) => {
        event.preventDefault()
        if (!isValid) {
          showValidation()
          return
        }

        setShowValidationMessage(false)
        nasaButtonRef.current?.focus()
      }}
      {...props}
    >
      <SearchInput
        aria-label="Search keywords"
        aria-describedby={describedBy}
        aria-invalid={showValidationMessage || undefined}
        value={query}
        onChange={updateQuery}
      />
      <div
        role="group"
        aria-label="Choose a library to search"
        aria-describedby={describedBy}
        css={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 'var(--space-2)',
          width: '100%',
          marginTop: 'var(--space-2)',
          [`@container (min-width: ${COMPACT_LAYOUT_MIN_WIDTH})`]: {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        <ProviderButton
          ref={nasaButtonRef}
          organization="NASA"
          library="Image and Video Library"
          onPress={() => runSearch(NASA_IVL_PROVIDER_ID)}
          onKeyDown={(e) => handleProviderKeyDown(e, NASA_IVL_PROVIDER_ID)}
        />
        <ProviderButton
          ref={sioaButtonRef}
          organization="Smithsonian Institution"
          library="National Air and Space Museum"
          onPress={() => runSearch(SI_OA_PROVIDER_ID)}
          onKeyDown={(e) => handleProviderKeyDown(e, SI_OA_PROVIDER_ID)}
        />
      </div>
      <p id={helperTextId}>{ANY_PROVIDER_HELP_TEXT}</p>
      {showValidationMessage && (
        <p
          id={validationMessageId}
          role="alert"
          css={searchValidationMessageCss}
        >
          {ANY_PROVIDER_VALIDATION_MESSAGE}
        </p>
      )}
    </Form>
  )
}

interface SelectedProviderSearchBarProps extends FormProps {
  initialQuery: string
  initialFilters: SearchFilters
}

const PROVIDERS: Array<{ id: ProviderId; label: string }> = [
  { id: NASA_IVL_PROVIDER_ID, label: 'NASA' },
  { id: SI_OA_PROVIDER_ID, label: 'SI' },
]

export function SelectedProviderSearchBar({
  initialQuery,
  initialFilters,
  ...props
}: SelectedProviderSearchBarProps) {
  const validationMessageId = useId()
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState(initialFilters)
  const [showValidationMessage, setShowValidationMessage] = useState(false)
  const providerLabelId = useId()
  const navigate = useNavigate()
  const isValid = query.trim().length > 0
  const providerId = filters.providerId

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery)

    if (nextQuery.trim().length > 0) {
      setShowValidationMessage(false)
    }
  }

  return (
    <Form
      aria-describedby={showValidationMessage ? validationMessageId : undefined}
      css={{ width: '100%' }}
      onSubmit={(event) => {
        event.preventDefault()
        if (!isValid) {
          setShowValidationMessage(true)
          return
        }

        setShowValidationMessage(false)
        navigate({
          to: '/search',
          search: searchParams(query, filters),
        })
      }}
      {...props}
    >
      <div
        css={{
          background: 'var(--secondary-bg)',
          color: 'var(--secondary-text)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 'var(--space-2)',
          alignItems: 'stretch',
          padding: 'var(--space-2)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          [`@container (min-width: ${SELECTED_PROVIDER_INLINE_MIN_WIDTH})`]: {
            gridTemplateColumns: 'minmax(0, 7rem) minmax(0, 1fr) auto',
            gap: 'var(--space-4)',
            alignItems: 'center',
          },
        }}
      >
        <VisuallyHidden>
          <Label id={providerLabelId}>Image Library</Label>
        </VisuallyHidden>
        <Select
          aria-labelledby={providerLabelId}
          items={PROVIDERS}
          css={{ width: '100%' }}
          value={providerId}
          getItemId={getIdProp}
          getItemText={getLabelProp}
          onChange={(value) => {
            const { data } = providerIdSchema.safeParse(value)
            if (data) {
              setFilters({ providerId: data, filters: {} })
            }
          }}
        />
        <SearchInput
          aria-label="Keywords"
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
          css={searchValidationMessageCss}
        >
          {SELECTED_PROVIDER_VALIDATION_MESSAGE}
        </p>
      )}
      {providerId === NASA_IVL_PROVIDER_ID && (
        <FiltersPanel>
          <NasaIvlFilters
            filters={filters.filters}
            onChange={(newFilters) => {
              setFilters({
                providerId: NASA_IVL_PROVIDER_ID,
                filters: newFilters,
              })
            }}
          />
        </FiltersPanel>
      )}
    </Form>
  )
}

const filtersPanelCss = {
  marginTop: 'var(--space-2)',
  padding: 'var(--space-4)',
  background: 'var(--secondary-bg)',
  color: 'var(--secondary-text)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-sm)',
  overflowX: 'auto' as const,
}

function FiltersPanel({ children }: { children: React.ReactNode }) {
  return <div css={filtersPanelCss}>{children}</div>
}
