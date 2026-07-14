import {
  Slider as RacSlider,
  SliderOutput as RacSliderOutput,
  SliderThumb as RacSliderThumb,
  SliderTrack as RacSliderTrack,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { StyleProps } from './style-props'

const sliderStyles = css.raw({
  display: 'grid',
  gap: '3',
  width: '100%',
  paddingTop: '1',
  paddingInline: '5',
  paddingBottom: '3',
  borderRadius: 'lg',
  backgroundColor: 'secondary.bg',
  color: 'secondary.text',
})

const sliderTrackStyles = css.raw({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  minHeight: 'controlHeight',
})

const sliderThumbStyles = css.raw({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 'controlHeight',
  minHeight: 'controlHeight',
  color: 'inherit',
  cursor: 'pointer',
  outline: 'none',
  _focusVisible: {
    outline: 'focusRing',
  },
})

const sliderOutputStyles = css.raw({
  fontSize: 'sm',
  color: 'inherit',
  padding: '3',
})

export type SliderProps = ComponentProps<typeof RacSlider> & StyleProps

export type SliderTrackProps = ComponentProps<typeof RacSliderTrack> &
  StyleProps

export type SliderThumbProps = ComponentProps<typeof RacSliderThumb> &
  StyleProps

export type SliderOutputProps = ComponentProps<typeof RacSliderOutput> &
  StyleProps

export function Slider({ css: cssProp, className, ...props }: SliderProps) {
  return (
    <RacSlider
      className={cx(css(sliderStyles, cssProp), className)}
      {...props}
    />
  )
}

export function SliderTrack({
  css: cssProp,
  className,
  ...props
}: SliderTrackProps) {
  return (
    <RacSliderTrack
      className={cx(css(sliderTrackStyles, cssProp), className)}
      {...props}
    />
  )
}

export function SliderThumb({
  css: cssProp,
  className,
  ...props
}: SliderThumbProps) {
  return (
    <RacSliderThumb
      className={cx(css(sliderThumbStyles, cssProp), className)}
      {...props}
    />
  )
}

export function SliderOutput({
  css: cssProp,
  className,
  ...props
}: SliderOutputProps) {
  return (
    <RacSliderOutput
      className={cx(css(sliderOutputStyles, cssProp), className)}
      {...props}
    />
  )
}
