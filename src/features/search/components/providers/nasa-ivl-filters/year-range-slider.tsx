import { CircleIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
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
    styles={css.raw({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      cursor: 'pointer',
      color: 'text.accent',
    })}
  >
    <CircleIcon weight="fill" />
    <SliderOutput
      styles={css.raw({
        fontSize: '0.9rem',
        position: 'absolute',
        top: '1rem',
        color: 'text',
      })}
    >
      {children}
    </SliderOutput>
  </SliderThumb>
)

export function YearRangeSlider({ styles, ...props }: SliderProps) {
  return (
    <Slider
      {...props}
      styles={css.raw(
        {
          backgroundColor: 'tertiary.bg',
          color: 'secondary.text',
          border: '1px solid token(colors.border)',
        },
        styles,
      )}
    >
      <SliderTrack
        styles={css.raw({
          marginTop: '0.5rem',
        })}
      >
        {({ state }) => (
          <div
            className={css({
              display: 'flex',
              width: '100%',
              borderTop: '1px solid token(colors.text.muted)',
            })}
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
