import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { SubmitButton } from './submit-button'
import type { SearchFieldProps } from '@/components/ui/search-field'
import { FieldError, Input } from '@/components/ui/forms'
import { SearchField } from '@/components/ui/search-field'
import { Button } from '@/components/ui/button'

export function SearchInput({ css: styles, ...props }: SearchFieldProps) {
  return (
    <SearchField
      isRequired
      {...props}
      css={css.raw(
        {
          flexGrow: 1,
        },
        styles,
      )}
    >
      <Input
        name="q"
        pattern=".*\S.*"
        placeholder="e.g. Crab Nebula"
        className={css({
          background: 'transparent',
          border: '[0]',
          color: '[inherit]',
          fontSize: '[1em]',
          width: 'full',
          paddingBlock: '1',
          // invisible, not none: forced-colors mode keeps a focus indicator
          '&:focus': {
            outline: '[2px solid transparent]',
            outlineOffset: '[2px]',
          },
          '&::-webkit-search-cancel-button': { display: 'none' },
          _autofill: {
            boxShadow: '[inset 0 0 0 100px token(colors.bg.surface.3)]',
            WebkitTextFillColor: 'text',
          },
        })}
      />
      <Button variant="icon" data-clear-button>
        <XIcon aria-hidden="true" />
      </Button>
      <SubmitButton />
      <FieldError>Please enter valid search keywords.</FieldError>
    </SearchField>
  )
}
