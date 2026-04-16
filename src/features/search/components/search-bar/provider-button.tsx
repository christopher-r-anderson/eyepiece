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
      css={{
        display: 'flex',
        width: '100%',
        minWidth: 0,
        justifyContent: 'space-between',
        whiteSpace: 'normal',
        textAlign: 'left',
      }}
      {...props}
    >
      <span
        css={{
          flex: 1,
          minWidth: 0,
          lineHeight: 'var(--line-height-tight)',
        }}
      >
        {organization} <br /> {library}
      </span>
    </Button>
  )
}
