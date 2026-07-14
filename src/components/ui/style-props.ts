import type { SystemStyleObject } from 'styled-system/types'

// the standard style surface of ui components: a css override merged
// object-level into the component's base styles, plus external classes
export type StyleProps = {
  css?: SystemStyleObject
  className?: string
}
