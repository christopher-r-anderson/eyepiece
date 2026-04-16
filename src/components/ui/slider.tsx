import {
  Slider as RacSlider,
  SliderOutput as RacSliderOutput,
  SliderThumb as RacSliderThumb,
  SliderTrack as RacSliderTrack,
} from 'react-aria-components'
import type { ComponentProps } from 'react'
import type { Interpolation, Theme } from '@emotion/react'

const sliderCss = {
  display: 'grid',
  gap: 'var(--space-3)',
  width: '100%',
  padding: 'var(--space-1) var(--space-5) var(--space-3)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--secondary-bg)',
  color: 'var(--secondary-text)',
}

const sliderTrackCss = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  minHeight: 'var(--size-control-height)',
}

const sliderThumbCss = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 'var(--size-control-height)',
  minHeight: 'var(--size-control-height)',
  color: 'inherit',
  cursor: 'pointer',
  outline: 'none',
  '&[data-focus-visible]': {
    outline: '1px solid var(--outline-color)',
  },
}

const sliderOutputCss = {
  fontSize: 'var(--text-sm)',
  color: 'inherit',
  padding: 'var(--space-3)',
}

export type SliderProps = ComponentProps<typeof RacSlider> & {
  css?: Interpolation<Theme>
}

export type SliderTrackProps = ComponentProps<typeof RacSliderTrack> & {
  css?: Interpolation<Theme>
}

export type SliderThumbProps = ComponentProps<typeof RacSliderThumb> & {
  css?: Interpolation<Theme>
}

export type SliderOutputProps = ComponentProps<typeof RacSliderOutput> & {
  css?: Interpolation<Theme>
}

export function Slider({ css: cssProp, ...props }: SliderProps) {
  return <RacSlider css={[sliderCss, cssProp]} {...props} />
}

export function SliderTrack({ css: cssProp, ...props }: SliderTrackProps) {
  return <RacSliderTrack css={[sliderTrackCss, cssProp]} {...props} />
}

export function SliderThumb({ css: cssProp, ...props }: SliderThumbProps) {
  return <RacSliderThumb css={[sliderThumbCss, cssProp]} {...props} />
}

export function SliderOutput({ css: cssProp, ...props }: SliderOutputProps) {
  return <RacSliderOutput css={[sliderOutputCss, cssProp]} {...props} />
}
