import type { SystemStyleObject } from 'styled-system/types'

// the style surface of hand-written ui components (styled() components get
// the equivalent from the factory). Intersecting className narrows react
// aria's `string | (renderProps) => string` union to a plain string so it
// can merge via cx; the render-function form is unsupported on purpose -
// state styling belongs in data-attribute conditions. styled() components
// keep the wider RAC type, where a function is accepted but ignored (cx
// drops non-strings)
export type StyleProps = {
  css?: SystemStyleObject
  className?: string
}
