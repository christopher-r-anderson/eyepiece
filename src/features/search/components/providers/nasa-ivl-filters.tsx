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
  backgroundColor: 'secondary.bg',
  color: 'secondary.text',
  boxShadow: 'sm',
  transitionFast: 'border-color, outline-color',
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '1px',
  },
})

export function NasaIvlFilters({ filters, onChange }: NasaIvlFiltersProps) {
  const yearsLabelId = useId()

  return (
    <div
      className={stack({
        gap: '4',
        color: 'secondary.text',
      })}
    >
      <Label id={yearsLabelId}>Year Range</Label>
      {/* each input bounds the other so native constraint validation
          enforces min <= max without JavaScript */}
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
            max={filters?.yearEnd ?? YEAR_MAX}
            placeholder={String(YEAR_MIN)}
            value={filters?.yearStart ?? ''}
            onChange={(event) => {
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
            min={filters?.yearStart ?? YEAR_MIN}
            max={YEAR_MAX}
            placeholder={String(YEAR_MAX)}
            value={filters?.yearEnd ?? ''}
            onChange={(event) => {
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
