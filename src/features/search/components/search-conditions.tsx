import { Suspense, useState } from 'react'
import { CatchBoundary } from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { useSuspenseSearchTotal } from '../search.queries'
import type { SearchScope } from '../search-page-params'
import type { NasaIvlSearchFilters } from '@/domain/search/providers/nasa-ivl-filters'
import { YEAR_MAX, YEAR_MIN } from '@/domain/search/providers/nasa-ivl-filters'
import {
  NASA_IVL_PROVIDER_ID,
  PROVIDERS,
  PROVIDER_DISPLAY,
} from '@/domain/provider/provider.schema'
import { defaultSearchFilters } from '@/domain/search/search.schema'

interface SearchConditionsProps {
  q: string
  scope: SearchScope
  formId: string
  nasaFilters: NasaIvlSearchFilters
  onNasaFiltersChange: (filters: NasaIvlSearchFilters) => void
  onNasaFiltersCommit: () => void
}

// D16: one conditions line on every scope, constant height, left-aligned.
// The count's width is unknowable up front, so the year cluster anchors to
// the line end and never moves while the count streams in
export function SearchConditions({
  q,
  scope,
  formId,
  nasaFilters,
  onNasaFiltersChange,
  onNasaFiltersCommit,
}: SearchConditionsProps) {
  const isNasaScope =
    scope.scope === 'provider' &&
    scope.filters.providerId === NASA_IVL_PROVIDER_ID
  const hasQuery = q.trim().length > 0

  return (
    <div
      className={flex({
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: '3',
        minHeight: 'touchTargetMin',
        textStyle: 'meta',
        textTransform: 'lowercase',
        color: 'text.muted',
      })}
    >
      <span
        className={css({
          minWidth: '0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flexShrink: 1,
        })}
      >
        {hasQuery && (
          <CatchBoundary
            getResetKey={() => hashKey(['conditions-count', q, scope])}
            errorComponent={() => null}
          >
            <Suspense fallback={null}>
              {scope.scope === 'provider' ? (
                <ProviderCount q={q} scope={scope} />
              ) : (
                <AllLibrariesCount q={q} />
              )}
            </Suspense>
          </CatchBoundary>
        )}
      </span>
      {isNasaScope && (
        <YearRangeFields
          formId={formId}
          filters={nasaFilters}
          onChange={onNasaFiltersChange}
          onCommit={onNasaFiltersCommit}
        />
      )}
    </div>
  )
}

function formatCount(total: number) {
  return `${total} ${total === 1 ? 'result' : 'results'}`
}

function ProviderCount({
  q,
  scope,
}: {
  q: string
  scope: Extract<SearchScope, { scope: 'provider' }>
}) {
  const total = useSuspenseSearchTotal(q, scope.filters)
  return `${formatCount(total)} · ${PROVIDER_DISPLAY[scope.filters.providerId].displayName}`
}

// one suspense total per provider - rules-of-hooks forbids a dynamic
// count, so this tracks the two libraries that ship in 1.0; a third
// provider has to extend the sum here
function AllLibrariesCount({ q }: { q: string }) {
  const totals = [
    useSuspenseSearchTotal(q, defaultSearchFilters(PROVIDERS[0])),
    useSuspenseSearchTotal(q, defaultSearchFilters(PROVIDERS[1])),
  ]
  const sum = totals.reduce((acc: number, total) => acc + total, 0)
  return `${formatCount(sum)} across ${PROVIDERS.length} libraries`
}

function toYearValue(raw: string) {
  if (raw === '') {
    return undefined
  }
  const year = Number(raw)
  return Number.isNaN(year) ? undefined : year
}

const yearInputCss = css.raw({
  width: '[3.625rem]',
  paddingBlock: '1',
  paddingInline: '1',
  textAlign: 'center',
  border: 'control',
  borderRadius: 'sm',
  backgroundColor: 'bg.surface.2',
  color: 'text',
  font: 'inherit',
  // native spin buttons read as foreign chrome (worst on firefox); the
  // number semantics, arrow keys, and min/max validation all remain
  appearance: 'textfield',
  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
    display: 'none',
  },
  transitionFast: 'background-color, border-color, outline-color',
  _hovered: {
    backgroundColor: 'bg.surface.3',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
})

function YearRangeFields({
  formId,
  filters,
  onChange,
  onCommit,
}: {
  formId: string
  filters: NasaIvlSearchFilters
  onChange: (filters: NasaIvlSearchFilters) => void
  onCommit: () => void
}) {
  // bounds cross-wire only after an edit: server-rendered attributes
  // cannot track the other input, and stale bounds would block valid
  // pre-hydration edits (an inverted no-JS submit drops as a pair at the
  // URL boundary instead)
  const [edited, setEdited] = useState(false)

  return (
    <span
      className={flex({
        alignItems: 'center',
        gap: '2',
        flexShrink: 0,
        marginInlineStart: 'auto',
      })}
    >
      <span>years</span>
      <input
        type="number"
        form={formId}
        name="yearStart"
        aria-label="Earliest year"
        min={YEAR_MIN}
        max={edited ? (filters.yearEnd ?? YEAR_MAX) : YEAR_MAX}
        placeholder={String(YEAR_MIN)}
        value={filters.yearStart ?? ''}
        onChange={(event) => {
          setEdited(true)
          onChange({
            yearEnd: filters.yearEnd,
            yearStart: toYearValue(event.target.value),
          })
        }}
        onBlur={onCommit}
        className={css(yearInputCss)}
      />
      <span aria-hidden="true">–</span>
      <input
        type="number"
        form={formId}
        name="yearEnd"
        aria-label="Latest year"
        min={edited ? (filters.yearStart ?? YEAR_MIN) : YEAR_MIN}
        max={YEAR_MAX}
        placeholder={String(YEAR_MAX)}
        value={filters.yearEnd ?? ''}
        onChange={(event) => {
          setEdited(true)
          onChange({
            yearStart: filters.yearStart,
            yearEnd: toYearValue(event.target.value),
          })
        }}
        onBlur={onCommit}
        className={css(yearInputCss)}
      />
    </span>
  )
}
