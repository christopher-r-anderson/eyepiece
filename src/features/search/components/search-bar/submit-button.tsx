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
      variant="bare"
      css={css.raw(
        {
          display: 'grid',
          placeItems: 'center',
          padding: '1',
          color: 'accent.emphasis',
          _hovered: {
            color: 'text',
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
