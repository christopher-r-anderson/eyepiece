import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'

export function SubmitButton({ css: styles, ...props }: ButtonProps) {
  return (
    <Button
      type="submit"
      aria-label="Search"
      css={css.raw(
        {
          background: 'transparent',
          borderColor: 'transparent',
          color: 'secondary.text',
          fontSize: '1em',
          minHeight: 'auto',
          padding: 0,
          _hovered: {
            backgroundColor: 'transparent',
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
      <MagnifyingGlassIcon />
    </Button>
  )
}
