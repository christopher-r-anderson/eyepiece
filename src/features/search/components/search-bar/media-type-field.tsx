import { ClassNames } from '@emotion/react'
import {
  ImagesIcon,
  ImageIcon,
  VideoIcon,
  WaveformIcon,
  CaretDownIcon,
} from '@phosphor-icons/react/dist/ssr'
import {
  SelectProps,
  Select,
  Label,
  SelectValue,
  Popover,
  ListBox,
  ListBoxItem,
  // purposely using ReactAria's Button to avoid hydration errors
  Button,
  Text,
} from 'react-aria-components'

export const ALL_MEDIA = 'all'

export const MEDIA_TYPES = [
  { id: ALL_MEDIA, label: 'All', icon: ImagesIcon },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: VideoIcon },
  { id: 'audio', label: 'Audio', icon: WaveformIcon },
]

interface MediaTypeFieldProps extends SelectProps {
  // FIXME: should we be overriding this?
  items?: typeof MEDIA_TYPES
  popoverFontSize?: string
}

export function MediaTypeField({
  popoverFontSize,
  items,
  ...props
}: MediaTypeFieldProps) {
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
            css={{ display: 'inline-flex', alignItems: 'center' }}
            {...props}
          >
            <Label />
            {/* using `ReactAria's Button` to avoid hydration errors
                there may be a way to fix this using custom `ListBox` types or hooks */}
            <Button
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
            </Button>
            <Popover
              className={css({
                fontSize: popoverFontSize,
                background: 'var(--primary-bg)',
                marginTop: '0.5em',
                color: 'var(--primary-text)',
                width: '6em',
                borderRadius: '0.25em',
              })}
            >
              <ListBox items={items ?? []}>
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
