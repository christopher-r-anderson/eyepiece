import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'

export function SubmitButton(props: ButtonProps) {
  return (
    <Button
      type="submit"
      aria-label="Search"
      css={{
        background: 'transparent',
        borderColor: 'transparent',
        color: 'var(--secondary-text)',
        fontSize: '1em',
        minHeight: 'auto',
        padding: 0,
        '&[data-hovered]': {
          backgroundColor: 'transparent',
          color: 'var(--text-accent)',
        },
        '&[data-disabled]': {
          color: 'var(--text-muted)',
        },
      }}
      {...props}
    >
      <MagnifyingGlassIcon />
    </Button>
  )
}
