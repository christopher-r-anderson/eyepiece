import { XIcon } from '@phosphor-icons/react/dist/ssr'
import {
  Button,
  FieldError,
  Input,
  SearchField as ReactAriaSearchField,
  SearchFieldProps,
} from 'react-aria-components'

export function SearchField(props: SearchFieldProps) {
  return (
    <ReactAriaSearchField
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
          border: 0,
          background: 'transparent',
          color: 'var(--primary-text)',
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: '1em',
          visibility: props.value ? 'visible' : 'hidden',
        }}
      >
        <XIcon />
      </Button>
      <FieldError>Please enter valid search keywords.</FieldError>
    </ReactAriaSearchField>
  )
}
