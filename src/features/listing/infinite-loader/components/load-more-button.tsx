import { css, cx } from 'styled-system/css'
import type { ComponentPropsWithoutRef } from 'react'

export function LoadMoreButton(props: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      {...props}
      className={cx(
        css({
          paddingBlock: '3',
          paddingInline: '5',
          fontSize: '1rem',
          borderRadius: 'md',
          border: 'none',
          cursor: !props.disabled ? 'pointer' : 'not-allowed',
        }),
        props.className,
      )}
    />
  )
}
