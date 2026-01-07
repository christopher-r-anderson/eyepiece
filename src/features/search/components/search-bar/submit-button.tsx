import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { Button } from 'react-aria-components'
import type { ButtonProps } from 'react-aria-components'

export function SubmitButton(props: ButtonProps) {
  return (
    <Button
      type="submit"
      aria-label="Search"
      css={{
        background: 'transparent',
        border: 0,
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '1em',
        color: 'var(--primary-text)',
        '&[data-disabled]': { color: 'var(--primary-text-muted)' },
      }}
      {...props}
    >
      <MagnifyingGlassIcon />
    </Button>
  )
}
