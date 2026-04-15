import { useId } from 'react-aria'
import {
  ImageIcon,
  ImagesIcon,
  VideoIcon,
  WaveformIcon,
} from '@phosphor-icons/react/dist/ssr'
import { YearRangeSlider } from './nasa-ivl-filters/year-range-slider'
import type { NasaIvlMediaType } from '@/domain/search/providers/nasa-ivl-filters'
import { YEAR_MAX, YEAR_MIN } from '@/domain/search/providers/nasa-ivl-filters'
import { Select } from '@/components/ui/select'
import { getIdProp, getLabelProp } from '@/components/ui/select.utils'
import { Label } from '@/components/ui/forms'

const ALL_MEDIA = 'all'

type MediaTypes = NasaIvlMediaType | typeof ALL_MEDIA

interface MediaTypeOption {
  id: MediaTypes
  label: string
  icon: React.ComponentType
}

const mediaOptions: Array<MediaTypeOption> = [
  { id: ALL_MEDIA, label: 'All', icon: ImagesIcon },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: VideoIcon },
  { id: 'audio', label: 'Audio', icon: WaveformIcon },
]

interface NasaIvlFiltersProps {
  filters?: {
    mediaType?: NasaIvlMediaType
    yearStart?: number
    yearEnd?: number
  }
  onChange?: (filters: {
    mediaType?: NasaIvlMediaType
    yearStart?: number
    yearEnd?: number
  }) => void
}

function toOutgoingFilters({
  mediaType,
  years,
}: {
  mediaType: MediaTypes
  years: [number, number]
}) {
  return {
    mediaType: mediaType === ALL_MEDIA ? undefined : mediaType,
    yearStart: years[0] === YEAR_MIN ? undefined : years[0],
    yearEnd: years[1] === YEAR_MAX ? undefined : years[1],
  }
}

export function NasaIvlFilters({ filters, onChange }: NasaIvlFiltersProps) {
  const mediaTypeLabelId = useId()
  const mediaType: MediaTypes = filters?.mediaType ?? ALL_MEDIA
  const yearsLabelId = useId()
  const years: [number, number] = [
    filters?.yearStart ?? YEAR_MIN,
    filters?.yearEnd ?? YEAR_MAX,
  ]

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Label id={mediaTypeLabelId}>Media Type</Label>
      <Select
        aria-labelledby={mediaTypeLabelId}
        items={mediaOptions}
        value={mediaType}
        getItemId={getIdProp}
        getItemText={getLabelProp}
        onChange={(value) => {
          if (onChange) {
            const newMediaType = value as MediaTypes
            onChange(toOutgoingFilters({ mediaType: newMediaType, years }))
          }
        }}
      />

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
              onChange(
                toOutgoingFilters({
                  mediaType,
                  years: [start, end],
                }),
              )
            }
          }
        }}
      />
    </div>
  )
}
