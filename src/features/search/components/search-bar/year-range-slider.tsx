import { CircleIcon } from '@phosphor-icons/react/dist/ssr'
import {
  Label,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from 'react-aria-components'
import type { SliderProps } from 'react-aria-components'

const Thumb = ({
  name,
  index,
  children,
}: {
  name: string
  index: number
  children: React.ReactNode
}) => (
  <SliderThumb
    name={name}
    index={index}
    css={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
    <CircleIcon weight="fill" />
    <SliderOutput
      css={{ fontSize: '0.9rem', position: 'absolute', top: '1rem' }}
    >
      {children}
    </SliderOutput>
  </SliderThumb>
)

export function YearRangeSlider(props: SliderProps) {
  return (
    <Slider
      {...props}
      css={{
        padding: '0.5rem 1.5rem 1.75rem 1rem',
        backgroundColor: 'var(--primary-bg)',
        margin: '0 1rem 0 1rem',
        color: 'var(--primary-text)',
      }}
    >
      <Label css={{ position: 'absolute' }}>Year Range</Label>
      <SliderTrack
        css={{
          marginLeft: '8rem',
          marginTop: '0.5rem',
        }}
      >
        {({ state }) => (
          <div
            css={{
              display: 'flex',
              width: '100%',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <Thumb name="yearStart" index={0}>
              {state.getThumbValue(0)}
            </Thumb>
            <Thumb name="yearEnd" index={1}>
              {state.getThumbValue(1)}
            </Thumb>
          </div>
        )}
      </SliderTrack>
    </Slider>
  )
}
