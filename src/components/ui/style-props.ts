import type { SystemStyleObject } from 'styled-system/types'

// the standard style surface of ui components: a css override merged as
// utility classes, which win over the component's recipe styles by cascade
// layer. className is deliberately rejected - style through css, variants,
// or (for router active states) attribute selectors like [aria-current]
export type StyleProps = {
  css?: SystemStyleObject
  className?: never
}
