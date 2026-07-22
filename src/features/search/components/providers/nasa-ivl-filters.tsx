import { useId } from 'react-aria'
import { stack } from 'styled-system/patterns'
import { YearRangeSlider } from './nasa-ivl-filters/year-range-slider'
import { YEAR_MAX, YEAR_MIN } from '@/domain/search/providers/nasa-ivl-filters'
import { Label } from '@/components/ui/forms'

interface NasaIvlFiltersProps {
  filters?: {
    yearStart?: number
    yearEnd?: number
  }
  onChange?: (filters: { yearStart?: number; yearEnd?: number }) => void
}

function toOutgoingFilters(years: [number, number]) {
  return {
    yearStart: years[0] === YEAR_MIN ? undefined : years[0],
    yearEnd: years[1] === YEAR_MAX ? undefined : years[1],
  }
}

export function NasaIvlFilters({ filters, onChange }: NasaIvlFiltersProps) {
  const yearsLabelId = useId()
  const years: [number, number] = [
    filters?.yearStart ?? YEAR_MIN,
    filters?.yearEnd ?? YEAR_MAX,
  ]

  return (
    <div
      className={stack({
        gap: '4',
        color: 'secondary.text',
      })}
    >
      <Label id={yearsLabelId}>Year Range</Label>
      <YearRangeSlider
        aria-labelledby={yearsLabelId}
        value={years}
        minValue={YEAR_MIN}
        maxValue={YEAR_MAX}
        onChange={(newYears) => {
          if (Array.isArray(newYears) && newYears.length === 2) {
            const [start, end] = newYears
            if (onChange) {
              onChange(toOutgoingFilters([start, end]))
            }
          }
        }}
      />
    </div>
  )
}
