import { css, cx } from 'styled-system/css'
import type { ComponentPropsWithoutRef } from 'react'

export function LoadMoreButton(props: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      {...props}
      className={cx(
        css({
          paddingBlock: '0.75rem',
          paddingInline: '1.5rem',
          fontSize: '1rem',
          borderRadius: '8px',
          border: 'none',
          cursor: !props.disabled ? 'pointer' : 'not-allowed',
        }),
        props.className,
      )}
    />
  )
}
