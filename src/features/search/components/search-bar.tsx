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
  const [query, setQuery] = useState(initialQuery)
  const nasaButtonRef = useRef<HTMLButtonElement | null>(null)
  const sioaButtonRef = useRef<HTMLButtonElement | null>(null)
  const navigate = useNavigate()
  const isValid = query.trim().length > 0

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
      return
    }
    navigate({
      to: '/search',
      search: searchParams(query, { providerId, filters: {} }),
    })
  }
  return (
    <Form
      aria-describedby="search-provider-help"
      css={{ width: '100%' }}
      onSubmit={(event) => {
        event.preventDefault()
        if (isValid) {
          nasaButtonRef.current?.focus()
        }
      }}
      {...props}
    >
      <SearchInput
        aria-label="Search keywords"
        value={query}
        onChange={setQuery}
      />
      <div
        role="group"
        aria-label="Choose a library to search"
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
          isDisabled={!isValid}
          organization="NASA"
          library="Image and Video Library"
          onPress={() => runSearch(NASA_IVL_PROVIDER_ID)}
          onKeyDown={(e) => handleProviderKeyDown(e, NASA_IVL_PROVIDER_ID)}
        />
        <ProviderButton
          ref={sioaButtonRef}
          isDisabled={!isValid}
          organization="Smithsonian Institution"
          library="National Air and Space Museum"
          onPress={() => runSearch(SI_OA_PROVIDER_ID)}
          onKeyDown={(e) => handleProviderKeyDown(e, SI_OA_PROVIDER_ID)}
        />
      </div>
      <p id="search-provider-help">
        Use either of the search buttons to pick your library.
      </p>
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
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState(initialFilters)
  const providerLabelId = useId()
  const navigate = useNavigate()
  const isValid = query.trim().length > 0
  const providerId = filters.providerId

  return (
    <Form
      css={{ width: '100%' }}
      onSubmit={(event) => {
        event.preventDefault()
        if (!isValid) {
          return
        }
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
        <SearchInput aria-label="Keywords" value={query} onChange={setQuery} />
        <SubmitButton isDisabled={!isValid} />
      </div>
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
