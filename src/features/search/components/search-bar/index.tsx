import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { DateButton } from './date-button'
import {
  ALL_MEDIA,
  MEDIA_TYPES,
  MediaTypeField,
  getMediaTypeOption,
} from './media-type-field'
import { SubmitButton } from './submit-button'
import { YearRangeSlider } from './year-range-slider'
import { SearchInput } from './search-input'
import type { FormProps } from '@/components/ui/forms'
import type { EyepieceMedia } from '@/lib/api/eyepiece/types'
import { Form } from '@/components/ui/forms'
import { YEAR_MAX, YEAR_MIN } from '@/lib/api/eyepiece/types'

interface SearchBarProps extends FormProps {
  allowDateRange?: boolean
  fontSize?: string
  defaultSearchText?: string
  defaultYears?: [number, number]
  defaultMediaType?: EyepieceMedia | typeof ALL_MEDIA
}

export function SearchBar({
  allowDateRange = true,
  defaultMediaType,
  defaultSearchText,
  defaultYears,
  ...props
}: SearchBarProps) {
  const [mediaType, setMediaType] = useState<EyepieceMedia | typeof ALL_MEDIA>(
    defaultMediaType || ALL_MEDIA,
  )
  const [searchText, setSearchText] = useState<string>(defaultSearchText || '')
  const [years, setYears] = useState<[number, number]>(
    defaultYears || [YEAR_MIN, YEAR_MAX],
  )
  const [showYearsSelected, setShowYearsSelected] = useState<boolean>(
    years[0] !== YEAR_MIN || years[1] !== YEAR_MAX,
  )
  const navigate = useNavigate()
  const isValid = searchText.trim().length > 0
  const fontSize = props.fontSize || '1rem'
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        if (isValid) {
          const query = {
            mediaType: mediaType !== ALL_MEDIA ? mediaType : undefined,
            q: searchText,
            yearStart: showYearsSelected ? years[0] : undefined,
            yearEnd: showYearsSelected ? years[1] : undefined,
          }
          navigate({
            to: '/',
            search: query,
          })
        }
      }}
      {...props}
    >
      <div
        css={{
          background: 'var(--primary-bg)',
          display: 'flex',
          flexBasis: 'auto',
          fontSize,
          gap: '1rem',
          alignItems: 'center',
          padding: '.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {allowDateRange && (
          <DateButton
            isSelected={showYearsSelected}
            onChange={(value) => {
              if (!value) {
                setYears([YEAR_MIN, YEAR_MAX])
              }
              setShowYearsSelected(value)
            }}
          />
        )}
        <MediaTypeField
          defaultValue={mediaType}
          onChange={(value) => {
            const option = getMediaTypeOption(value)
            if (option !== undefined) {
              setMediaType(option.id)
            }
          }}
          items={MEDIA_TYPES}
          popoverFontSize={fontSize}
        />
        <SearchInput
          aria-label="Keywords"
          value={searchText}
          onChange={setSearchText}
          defaultValue={defaultSearchText}
        />
        <SubmitButton isDisabled={!isValid} />
      </div>
      {allowDateRange && showYearsSelected && (
        <YearRangeSlider
          value={years}
          minValue={YEAR_MIN}
          maxValue={YEAR_MAX}
          onChange={(newYears) => {
            if (Array.isArray(newYears) && newYears.length === 2) {
              const [start, end] = newYears
              setYears([start, end])
            }
          }}
        />
      )}
    </Form>
  )
}
