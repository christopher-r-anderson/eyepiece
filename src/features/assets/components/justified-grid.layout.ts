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
    // a sparse row can grow any tile to the width cap regardless of ratio,
    // so the candidate bound comes from the cap, not the sizes estimate
    maxSlotWidth: Math.round(ROW_HEIGHT * WIDTH_CAP_RATIO),
  }
}

// grids stop at the content column; below md the viewport itself is narrower
const LINE_MAX = 16 * parseFloat(token('sizes.contentMax'))
const LINE_MAX_NARROW = 16 * parseFloat(token('breakpoints.md'))
const EAGER_ROWS = 2
const EAGER_ROWS_NARROW = 4

// Row membership depends on aspect ratios, so the eager set walks flex
// bases against a budget of lines per breakpoint; tiles just past it still
// load early through the browser's lazy-load margin.
export function eagerTileCount(aspectRatios: Array<number>) {
  const count = (rowHeight: number, budget: number) => {
    let sum = 0
    let index = 0
    while (index < aspectRatios.length && sum < budget) {
      sum += Math.min(
        aspectRatios[index] * rowHeight,
        rowHeight * WIDTH_CAP_RATIO,
      )
      index += 1
    }
    return index
  }
  return Math.max(
    count(ROW_HEIGHT, EAGER_ROWS * LINE_MAX),
    count(ROW_HEIGHT_NARROW, EAGER_ROWS_NARROW * LINE_MAX_NARROW),
  )
}
