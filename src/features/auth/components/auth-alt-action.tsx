import { css } from 'styled-system/css'
import type { ReactNode } from 'react'

export const authAltActionLinkCss = css.raw({
  textDecoration: 'underline',
  marginLeft: '2',
})

export function AuthAltAction({ children }: { children: ReactNode }) {
  return (
    <p
      className={css({
        marginTop: '4',
        marginInline: '0',
        marginBottom: '0',
        lineHeight: 'base',
      })}
    >
      {children}
    </p>
  )
}
