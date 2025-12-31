import { ComponentPropsWithoutRef } from "react";

export function LoadMoreButton(props: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      {...props}
      css={{
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        borderRadius: '8px',
        border: 'none',
        cursor: !props.disabled ? 'pointer' : 'not-allowed',
      }}
    />
  )
}
