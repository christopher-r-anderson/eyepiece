import { XIcon } from '@phosphor-icons/react/dist/ssr'
import type { SearchFieldProps } from '@/components/ui/search-field'
import { FieldError, Input } from '@/components/ui/forms'
import { SearchField } from '@/components/ui/search-field'
import { Button } from '@/components/ui/button'

export function SearchInput(props: SearchFieldProps) {
  return (
    <SearchField
      {...props}
      css={{
        display: 'inline-flex',
        alignItems: 'center',
        flexGrow: 1,
      }}
    >
      <Input
        placeholder="e.g. Crab Nebula"
        css={{
          background: 'transparent',
          border: 0,
          fontSize: '1em',
          width: '100%',
          '&:focus': {
            outline: 'none',
            boxShadow: '0 1px 0 0 var(--border-color)',
          },
          '&::-webkit-search-cancel-button': { display: 'none' },
          '&::placeholder': { color: 'var(--primary-text-muted)' },
          '&:autofill': {
            boxShadow: '0 1px 0 0 yellow, inset 0 0 0 100px var(--primary-bg)',
            WebkitTextFillColor: 'var(--primary-text)',
          },
        }}
      />
      <Button
        css={{
          background: 'transparent',
          color: props.value
            ? 'var(--primary-text)'
            : 'var(--primary-text-muted)',
          fontSize: '1em',
        }}
      >
        <XIcon />
      </Button>
      <FieldError>Please enter valid search keywords.</FieldError>
    </SearchField>
  )
}
