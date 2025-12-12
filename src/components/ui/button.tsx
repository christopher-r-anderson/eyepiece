import { Button as ReactAriaButton } from 'react-aria-components'
import type { ButtonProps } from 'react-aria-components'

export function Button(props: ButtonProps) {
  return (
    <ReactAriaButton
      css={{
        backgroundColor: 'var(--background)',
        color: 'var(--text)',
        '&[data-focused]': {
          outline: 'none',
        },
        '&[data-focus-visible]': {
          outline: '1px solid var(--outline-color)',
        },
      }}
      {...props}
    />
  )
}
