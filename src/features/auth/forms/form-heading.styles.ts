import { css } from 'styled-system/css'
import type { SystemStyleObject } from 'styled-system/types'
import type { HeadingLevel } from '@/components/ui/heading'

export function authFormHeadingCss(
  level: HeadingLevel,
): SystemStyleObject | undefined {
  if (level === 1) return css.raw({ textStyle: 'title.lg' })
  if (level === 2) return css.raw({ textStyle: 'title.md' })
  return undefined
}
