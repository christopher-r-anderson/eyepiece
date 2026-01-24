import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'

export function SubmitButton(props: ButtonProps) {
  return (
    <Button
      type="submit"
      aria-label="Search"
      variant="primary"
      css={{
        background: 'transparent',
        fontSize: '1em',
      }}
      {...props}
    >
      <MagnifyingGlassIcon />
    </Button>
  )
}
