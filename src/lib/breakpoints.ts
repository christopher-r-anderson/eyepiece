import { token } from 'styled-system/tokens'

// panda's mdDown condition, rebuilt for `sizes` media queries from the same
// token so a breakpoint change cannot desync what the browser fetches from
// what the stylesheet lays out. md is min-width, so this sits 1px below it.
export const BELOW_MD_QUERY = `(max-width: ${
  parseFloat(token('breakpoints.md')) - 0.0625
}rem)`
