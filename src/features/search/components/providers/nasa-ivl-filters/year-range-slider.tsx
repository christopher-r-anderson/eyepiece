import { CircleIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
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
  name?: string
  index: number
  children: React.ReactNode
}) => (
  <SliderThumb
    name={name}
    index={index}
    css={css.raw({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      cursor: 'pointer',
      color: 'text.accent',
    })}
  >
    <CircleIcon weight="fill" />
    <SliderOutput
      css={css.raw({
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

// a thumb with no name is not a successful form control; callers name a
// thumb only when its bound is an explicit filter, keeping default bounds
// out of native (pre-hydration) submissions
type ThumbNames = { start?: string; end?: string }

export function YearRangeSlider({
  css: styles,
  thumbNames,
  ...props
}: SliderProps & { thumbNames?: ThumbNames }) {
  return (
    <Slider
      {...props}
      css={css.raw(
        {
          backgroundColor: 'tertiary.bg',
          color: 'secondary.text',
          border: 'default',
        },
        styles,
      )}
    >
      <SliderTrack
        css={css.raw({
          marginTop: '2',
        })}
      >
        {({ state }) => (
          <div
            className={flex({
              width: '100%',
              borderTop: '1px solid token(colors.text.muted)',
            })}
          >
            <Thumb name={thumbNames?.start} index={0}>
              {state.getThumbValue(0)}
            </Thumb>
            <Thumb name={thumbNames?.end} index={1}>
              {state.getThumbValue(1)}
            </Thumb>
          </div>
        )}
      </SliderTrack>
    </Slider>
  )
}
