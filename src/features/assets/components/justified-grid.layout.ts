import { token } from 'styled-system/tokens'
import { BELOW_MD_QUERY } from '@/lib/breakpoints'

// Shared by the justified grid and the tile it renders. The tile needs the
// row height to tell the browser how wide it will be laid out, and importing
// it from the grid would close a cycle.
//
// Both sides read the row height from the same token: panda extracts styles
// statically, so the stylesheet cannot read a value from here, but token()
// resolves to the same literal at runtime.
const ROW_HEIGHT = parseFloat(token('sizes.assetGridRow'))
const ROW_HEIGHT_NARROW = parseFloat(token('sizes.assetGridRowNarrow'))

// a tile's basis is its ratio at the row height; flex-grow then shares out the
// row's leftover space, and this covers that growth up to the cap
const GROWTH_HEADROOM = 1.5
// mirrors the maxWidth in justifiedGridItemCss
const WIDTH_CAP_RATIO = 2.4 * 1.6

export function justifiedTileImageGeometry(aspectRatio: number) {
  const at = (height: number) =>
    Math.round(
      Math.min(
        aspectRatio * height * GROWTH_HEADROOM,
        height * WIDTH_CAP_RATIO,
      ),
    )
  return {
    sizes: `${BELOW_MD_QUERY} ${at(ROW_HEIGHT_NARROW)}px, ${at(ROW_HEIGHT)}px`,
    maxSlotWidth: at(ROW_HEIGHT),
  }
}

// grids stop at the content column
const LINE_MAX = 16 * parseFloat(token('sizes.contentMax'))
const EAGER_ROWS = 2

// Row membership depends on aspect ratios, so the eager set walks flex
// bases against a two-desktop-line budget. The same count reaches deeper
// on narrow screens, whose bases shrink in proportion; tiles just past it
// still load early through the browser's lazy-load margin.
export function eagerTileCount(aspectRatios: Array<number>) {
  const budget = EAGER_ROWS * LINE_MAX
  let sum = 0
  let index = 0
  while (index < aspectRatios.length && sum < budget) {
    sum += Math.min(
      aspectRatios[index] * ROW_HEIGHT,
      ROW_HEIGHT * WIDTH_CAP_RATIO,
    )
    index += 1
  }
  return index
}
