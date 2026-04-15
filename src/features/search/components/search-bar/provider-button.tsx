import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'

export type ProviderButtonProps = Omit<ButtonProps, 'icon' | 'children'> & {
  organization: string
  library: string
}

export function ProviderButton({
  organization,
  library,
  ...props
}: ProviderButtonProps) {
  return (
    <Button
      type="button"
      variant="primary"
      icon={MagnifyingGlassIcon}
      style={{ display: 'flex', flex: 1 }}
      {...props}
    >
      <span style={{ flex: 1 }}>
        {organization} <br /> {library}
      </span>
    </Button>
  )
}
