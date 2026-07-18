import {
  Slider as RacSlider,
  SliderOutput as RacSliderOutput,
  SliderThumb as RacSliderThumb,
  SliderTrack as RacSliderTrack,
} from 'react-aria-components'
import { createStyleContext } from 'styled-system/jsx'
import { slider } from 'styled-system/recipes'
import type { ComponentProps } from 'react'
import type { UiComponent } from './style-contract'

const ctx = createStyleContext(slider)

export const Slider = ctx.withProvider(RacSlider, 'root') as UiComponent<
  typeof RacSlider
>

export const SliderTrack = ctx.withContext(
  RacSliderTrack,
  'track',
) as UiComponent<typeof RacSliderTrack>

export const SliderThumb = ctx.withContext(
  RacSliderThumb,
  'thumb',
) as UiComponent<typeof RacSliderThumb>

export const SliderOutput = ctx.withContext(
  RacSliderOutput,
  'output',
) as UiComponent<typeof RacSliderOutput>

export type SliderProps = ComponentProps<typeof Slider>
