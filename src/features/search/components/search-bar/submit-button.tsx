import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'

export function SubmitButton({ css: styles, ...props }: ButtonProps) {
  return (
    <Button
      type="submit"
      aria-label="Search"
      variant="bare"
      css={css.raw(
        {
          color: 'secondary.text',
          _hovered: {
            color: 'text.accent',
          },
          _disabled: {
            color: 'text.muted',
          },
        },
        styles,
      )}
      {...props}
    >
      <MagnifyingGlassIcon aria-hidden="true" />
    </Button>
  )
}
