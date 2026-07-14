import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import type { SearchFieldProps } from '@/components/ui/search-field'
import { FieldError, Input } from '@/components/ui/forms'
import { SearchField } from '@/components/ui/search-field'
import { Button } from '@/components/ui/button'

export function SearchInput({ css: styles, ...props }: SearchFieldProps) {
  return (
    <SearchField
      {...props}
      css={css.raw(
        {
          flexGrow: 1,
        },
        styles,
      )}
    >
      <Input
        placeholder="e.g. Crab Nebula"
        className={css({
          background: 'transparent',
          border: 0,
          color: 'inherit',
          fontSize: '1em',
          width: '100%',
          '&:focus': {
            outline: 'none',
          },
          _focused: {
            boxShadow: '0 1px 0 0 token(colors.border)',
          },
          '&::-webkit-search-cancel-button': { display: 'none' },
          _placeholder: { color: 'text.muted' },
          _autofill: {
            boxShadow:
              '0 1px 0 0 token(colors.border), inset 0 0 0 100px token(colors.tertiary.bg)',
            WebkitTextFillColor: 'token(colors.text)',
          },
        })}
      />
      <Button
        variant="bare"
        css={css.raw(props.value ? { color: 'text' } : { color: 'text.muted' })}
      >
        <XIcon />
      </Button>
      <FieldError>Please enter valid search keywords.</FieldError>
    </SearchField>
  )
}
