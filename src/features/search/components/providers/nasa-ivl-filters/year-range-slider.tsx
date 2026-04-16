import { CircleIcon } from '@phosphor-icons/react/dist/ssr'
import type { SliderProps } from '@/components/ui/slider'
import {
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from '@/components/ui/slider'

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
      cursor: 'pointer',
      color: 'var(--text-accent)',
    }}
  >
    <CircleIcon weight="fill" />
    <SliderOutput
      css={{
        fontSize: '0.9rem',
        position: 'absolute',
        top: '1rem',
        color: 'var(--text)',
      }}
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
        backgroundColor: 'var(--tertiary-bg)',
        color: 'var(--secondary-text)',
        border: '1px solid var(--border-color)',
      }}
    >
      <SliderTrack
        css={{
          marginTop: '0.5rem',
        }}
      >
        {({ state }) => (
          <div
            css={{
              display: 'flex',
              width: '100%',
              borderTop: '1px solid var(--text-muted)',
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
