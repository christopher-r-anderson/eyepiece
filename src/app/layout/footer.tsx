import { css, cx } from 'styled-system/css'
import type { ComponentPropsWithoutRef } from 'react'

export function Footer(props: ComponentPropsWithoutRef<'footer'>) {
  return (
    <footer
      {...props}
      className={cx(
        css({
          maxWidth: 'pageMax',
          width: 'full',
          marginInline: 'auto',
          paddingInline: 'pageInline',
          paddingBlock: '[28px 36px]',
          color: 'text.muted',
          textStyle: 'meta',
          '& a': {
            color: '[inherit]',
            _hovered: { color: 'text' },
          },
        }),
        props.className,
      )}
    >
      <p>
        &copy; 2026 christopher anderson &middot; imagery courtesy of nasa (
        <a
          href="https://www.nasa.gov/nasa-brand-center/images-and-media/"
          target="_blank"
          rel="noreferrer"
        >
          media guidelines
        </a>
        ) and the smithsonian institution (
        <a
          href="https://www.si.edu/openaccess"
          target="_blank"
          rel="noreferrer"
        >
          open access, cc0
        </a>
        )
      </p>
    </footer>
  )
}
