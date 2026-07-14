/** @jsxImportSource react */
import {
  Slider as RacSlider,
  SliderOutput as RacSliderOutput,
  SliderThumb as RacSliderThumb,
  SliderTrack as RacSliderTrack,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { SystemStyleObject } from 'styled-system/types'

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
    outline: '1px solid token(colors.outline)',
  },
})

const sliderOutputStyles = css.raw({
  fontSize: 'sm',
  color: 'inherit',
  padding: '3',
})

export type SliderProps = ComponentProps<typeof RacSlider> & {
  styles?: SystemStyleObject
  className?: string
}

export type SliderTrackProps = ComponentProps<typeof RacSliderTrack> & {
  styles?: SystemStyleObject
  className?: string
}

export type SliderThumbProps = ComponentProps<typeof RacSliderThumb> & {
  styles?: SystemStyleObject
  className?: string
}

export type SliderOutputProps = ComponentProps<typeof RacSliderOutput> & {
  styles?: SystemStyleObject
  className?: string
}

export function Slider({ styles: cssProp, className, ...props }: SliderProps) {
  return (
    <RacSlider
      className={cx(css(sliderStyles, cssProp), className)}
      {...props}
    />
  )
}

export function SliderTrack({
  styles: cssProp,
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
  styles: cssProp,
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
  styles: cssProp,
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
