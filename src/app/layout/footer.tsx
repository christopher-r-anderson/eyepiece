import { css, cx } from 'styled-system/css'
import type { ComponentPropsWithoutRef } from 'react'

export function Footer(props: ComponentPropsWithoutRef<'footer'>) {
  return (
    <footer
      {...props}
      className={cx(
        css({
          maxWidth: 'pageMax',
          width: '100%',
          marginInline: 'auto',
          paddingInline: 'pageInline',
          paddingBlock: '28px 36px',
          color: 'text.muted',
          fontFamily: 'mono',
          fontSize: 'mono',
        }),
        props.className,
      )}
    >
      <p>
        &copy; 2026 christopher anderson &middot; imagery courtesy of nasa and
        the smithsonian institution &mdash; public domain
      </p>
    </footer>
  )
}
