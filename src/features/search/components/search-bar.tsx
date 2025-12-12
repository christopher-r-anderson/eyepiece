import { useState } from 'react'
import {
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Button as ReactAriaButton,
  SearchField as ReactAriaSearchField,
  Select,
  SelectValue,
  Text,
} from 'react-aria-components'
import {
  CaretDownIcon,
  ImageIcon,
  ImagesIcon,
  MagnifyingGlassIcon,
  VideoIcon,
  WaveformIcon,
  XIcon,
} from '@phosphor-icons/react/ssr'
import { ClassNames } from '@emotion/react'
import type {
  ButtonProps,
  FormProps,
  Key,
  SearchFieldProps as ReactAriaSearchFieldProps,
} from 'react-aria-components'
import { Button } from '@/components/ui/button'

const MEDIA_TYPES = [
  { id: 'all', label: 'All', icon: ImagesIcon },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: VideoIcon },
  { id: 'audio', label: 'Audio', icon: WaveformIcon },
]

interface MediaTypeFieldProps {
  initialValue?: Key
  items?: typeof MEDIA_TYPES
  onChange?: (value: Key) => void
  popoverFontSize?: string
}

function MediaTypeField(props: MediaTypeFieldProps) {
  const [mediaType, setMediaType] = useState<Key>(props.initialValue ?? '')
  // using ClassNames, css(), and assigning to classNames to avoid hydration errors
  return (
    <ClassNames>
      {({ css }) => {
        // moving styles here to use css() without getting a css must be used during render error
        const listBoxItemStyles = css({
          display: 'flex',
          alignItems: 'center',
          gap: '.5em',
          padding: '0.25em',
          '&[data-hovered]': {
            background: 'var(--secondary-bg)',
            color: 'var(--secondary-text)',
          },
          '&[data-focused]': {
            outline: 'none',
          },
          '&[data-focus-visible]': {
            outline: '1px solid var(--outline-color)',
          },
        })
        return (
          <Select
            value={mediaType}
            onChange={(selected) => {
              if (selected !== null) {
                setMediaType(selected)
                if (props.onChange) {
                  props.onChange(selected)
                }
              }
            }}
            css={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <Label />
            {/* using `ReactAriaButton` to avoid hydration errors
                there may be a way to fix this using custom `ListBox` types or hooks */}
            <ReactAriaButton
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                width: '6em',
                fontSize: '1em',
                justifyContent: 'space-between',
                border: 0,
                padding: '0.25em 0.5em',
                borderRadius: '0.25em',
                background: 'var(--secondary-bg)',
                color: 'var(--secondary-text)',
              })}
            >
              <SelectValue
                css={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.5em',
                  width: '6em',
                }}
              />
              <span
                aria-hidden="true"
                css={{
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <CaretDownIcon />
              </span>
            </ReactAriaButton>
            <Popover
              className={css({
                fontSize: props.popoverFontSize,
                background: 'var(--primary-bg)',
                marginTop: '0.5em',
                color: 'var(--primary-text)',
                width: '6em',
                borderRadius: '0.25em',
              })}
            >
              <ListBox items={props.items ?? []}>
                {(item) => (
                  <ListBoxItem
                    className={listBoxItemStyles}
                    textValue={item.label}
                  >
                    <item.icon />
                    <Text slot="label">{item.label}</Text>
                  </ListBoxItem>
                )}
              </ListBox>
            </Popover>
          </Select>
        )
      }}
    </ClassNames>
  )
}

interface SearchFieldProps extends ReactAriaSearchFieldProps {
  initialValue?: string
  onChange?: (value: string) => void
}

function SearchField({ initialValue, onChange, ...props }: SearchFieldProps) {
  const [searchText, setSearchText] = useState(initialValue ?? '')
  return (
    <ReactAriaSearchField
      {...props}
      value={searchText}
      onChange={(value) => {
        setSearchText(value)
        if (onChange) {
          onChange(value)
        }
      }}
      css={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <Input
        placeholder="e.g. Crab Nebula"
        css={{
          background: 'transparent',
          border: 0,
          fontSize: '1em',
          '&:focus': {
            outline: 'none',
            boxShadow: '0 1px 0 0 var(--border-color)',
          },
          '&::-webkit-search-cancel-button': { display: 'none' },
          '&::placeholder': { color: 'var(--primary-text-muted)' },
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
          visibility: searchText ? 'visible' : 'hidden',
        }}
      >
        <XIcon />
      </Button>
      <FieldError>Please enter valid search keywords.</FieldError>
    </ReactAriaSearchField>
  )
}

function SubmitButton(props: ButtonProps) {
  return (
    <Button
      type="submit"
      aria-label="Search"
      css={{
        background: 'transparent',
        border: 0,
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '1em',
        color: 'var(--primary-text)',
        '&[data-disabled]': { color: 'var(--primary-text-muted)' },
      }}
      {...props}
    >
      <MagnifyingGlassIcon />
    </Button>
  )
}

interface SearchBarProps extends FormProps {
  fontSize?: string
}

export function SearchBar(props: SearchBarProps) {
  const [mediaType, setMediaType] = useState<Key>('all')
  const [searchText, setSearchText] = useState<string>('')
  const isValid = searchText.trim().length > 0
  const fontSize = props.fontSize || '1rem'
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        if (isValid) {
          console.log('Submit:', { mediaType, searchText })
        }
      }}
      css={{
        background: 'var(--primary-bg)',
        display: 'flex',
        flexBasis: 'auto',
        fontSize,
        gap: '1rem',
        alignItems: 'center',
        padding: '.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
      {...props}
    >
      <MediaTypeField
        initialValue={mediaType}
        onChange={setMediaType}
        items={MEDIA_TYPES}
        popoverFontSize={fontSize}
      />
      <SearchField
        aria-label="Keywords"
        value={searchText}
        onChange={setSearchText}
      />
      <SubmitButton isDisabled={!isValid} />
    </Form>
  )
}
