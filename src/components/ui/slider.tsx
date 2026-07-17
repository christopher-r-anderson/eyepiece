import {
  Slider as RacSlider,
  SliderOutput as RacSliderOutput,
  SliderThumb as RacSliderThumb,
  SliderTrack as RacSliderTrack,
} from 'react-aria-components'
import { styled } from 'styled-system/jsx'
import {
  slider,
  sliderOutput,
  sliderThumb,
  sliderTrack,
} from 'styled-system/recipes'
import type { ComponentProps } from 'react'

export const Slider = styled(RacSlider, slider)

export const SliderTrack = styled(RacSliderTrack, sliderTrack)

export const SliderThumb = styled(RacSliderThumb, sliderThumb)

export const SliderOutput = styled(RacSliderOutput, sliderOutput)

export type SliderProps = ComponentProps<typeof Slider>
