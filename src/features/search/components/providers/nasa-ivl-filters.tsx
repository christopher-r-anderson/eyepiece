import { useState } from 'react'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { flex, stack } from 'styled-system/patterns'
import { YEAR_MAX, YEAR_MIN } from '@/domain/search/providers/nasa-ivl-filters'
import { Label } from '@/components/ui/forms'

interface NasaIvlFiltersProps {
  filters?: {
    yearStart?: number
    yearEnd?: number
  }
  onChange?: (filters: { yearStart?: number; yearEnd?: number }) => void
}

function toYearValue(raw: string) {
  if (raw === '') {
    return undefined
  }
  const year = Number(raw)
  return Number.isNaN(year) ? undefined : year
}

const yearInputCss = css.raw({
  width: '6rem',
  minHeight: 'controlHeight',
  paddingInline: '3',
  borderRadius: 'md',
  border: 'control',
  backgroundColor: 'bg.surface.2',
  color: 'text',
  boxShadow: 'sm',
  transitionFast: 'border-color, outline-color',
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '1px',
  },
})

export function NasaIvlFilters({ filters, onChange }: NasaIvlFiltersProps) {
  const yearsLabelId = useId()
  // bounds cross-wire only after an edit: server-rendered attributes
  // cannot track the other input, and stale bounds would block valid
  // pre-hydration edits (an inverted no-JS submit drops as a pair at the
  // URL boundary instead)
  const [edited, setEdited] = useState(false)

  return (
    <div
      className={stack({
        gap: '4',
        color: 'text',
      })}
    >
      <Label id={yearsLabelId}>Year Range</Label>
      <div
        role="group"
        aria-labelledby={yearsLabelId}
        className={flex({ gap: '4', alignItems: 'center' })}
      >
        <label className={flex({ gap: '2', alignItems: 'center' })}>
          From
          <input
            type="number"
            name="yearStart"
            min={YEAR_MIN}
            max={edited ? (filters?.yearEnd ?? YEAR_MAX) : YEAR_MAX}
            placeholder={String(YEAR_MIN)}
            value={filters?.yearStart ?? ''}
            onChange={(event) => {
              setEdited(true)
              onChange?.({
                yearEnd: filters?.yearEnd,
                yearStart: toYearValue(event.target.value),
              })
            }}
            className={css(yearInputCss)}
          />
        </label>
        <label className={flex({ gap: '2', alignItems: 'center' })}>
          To
          <input
            type="number"
            name="yearEnd"
            min={edited ? (filters?.yearStart ?? YEAR_MIN) : YEAR_MIN}
            max={YEAR_MAX}
            placeholder={String(YEAR_MAX)}
            value={filters?.yearEnd ?? ''}
            onChange={(event) => {
              setEdited(true)
              onChange?.({
                yearStart: filters?.yearStart,
                yearEnd: toYearValue(event.target.value),
              })
            }}
            className={css(yearInputCss)}
          />
        </label>
      </div>
    </div>
  )
}
