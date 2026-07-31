import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'

export function SubmitButton({ css: styles, ...props }: ButtonProps) {
  return (
    <Button
      type="submit"
      // opt out of SearchField's button slot, which would otherwise turn
      // this into a second clear button
      slot={null}
      aria-label="Search"
      variant="icon"
      css={css.raw(
        {
          color: 'accent.emphasis',
          _hovered: {
            color: 'text',
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
