import { css, cx } from 'styled-system/css'
import type { ComponentPropsWithoutRef } from 'react'

export function Footer(props: ComponentPropsWithoutRef<'footer'>) {
  return (
    <footer
      {...props}
      className={cx(
        css({
          padding: '4',
        }),
        props.className,
      )}
    >
      <p>&copy; 2025 Christopher Anderson</p>
    </footer>
  )
}
