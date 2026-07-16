import type { SystemStyleObject } from 'styled-system/types'

// the style surface of hand-written ui components, mirroring the styled()
// factory contract: css overrides win over recipe styles by cascade layer,
// and an incoming className is appended, never replacing generated classes
export type StyleProps = {
  css?: SystemStyleObject
  className?: string
}
