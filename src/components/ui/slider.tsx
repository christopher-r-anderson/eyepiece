import {
  Slider as RacSlider,
  SliderOutput as RacSliderOutput,
  SliderThumb as RacSliderThumb,
  SliderTrack as RacSliderTrack,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { slider } from 'styled-system/recipes'
import type { ComponentProps } from 'react'
import type { StyleProps } from './style-props'

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
      {...props}
      className={cx(slider().root, css(cssProp), className)}
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
      {...props}
      className={cx(slider().track, css(cssProp), className)}
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
      {...props}
      className={cx(slider().thumb, css(cssProp), className)}
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
      {...props}
      className={cx(slider().output, css(cssProp), className)}
    />
  )
}
