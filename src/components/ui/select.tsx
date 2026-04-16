import { useHydrated } from '@tanstack/react-router'
import { Select as RacSelect, SelectValue } from 'react-aria-components'
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr'
import { Button } from './button'
import type { ButtonProps } from './button'
import type {
  ListBoxItemRenderProps,
  SelectProps as RacSelectProps,
} from 'react-aria-components'
import type { Interpolation, Theme } from '@emotion/react'
import { ListBox, ListBoxItem } from '@/components/ui/list-box'
import { Popover } from '@/components/ui/popover'

type SelectProps<T extends object> = {
  items: Array<T>
  getItemId: (item: T) => string
  getItemText: (item: T) => string
  renderItem?: (item: T, itemProps?: ListBoxItemRenderProps) => React.ReactNode
  buttonVariant?: ButtonProps['variant']
  css?: Interpolation<Theme>
} & Pick<
  RacSelectProps<T>,
  'defaultValue' | 'value' | 'placeholder' | 'onChange' | 'style'
>

// React Aria Components' Select does not support emotion and causes hydration errors and flashes of unstyled content
// https://github.com/adobe/react-spectrum/issues/6214
// rather than having a custom styling approach that uses `<ClassNames>` and `className={css()}` (which also requires styling inside of a render),
// render a placeholder on the server that does not use Select, but does use the same styles and text
// the tradeoff is that this requires always using `placeholder` and `getItemText`,
// though `placeholder` is handled internally (will need to address once i18n is added)
// and `getItemText` is better handled explicitly anyways so react aria components don't have to try and extract it with complex children
export function Select<T extends object>(
  props: SelectProps<T> & { serverOnly?: boolean },
) {
  const isHydrated = useHydrated()
  // make sure we have a placeholder so it can be used in the server rendered component
  const { serverOnly, placeholder = 'Please select an item', ...rest } = props
  const mappedProps = {
    placeholder,
    ...rest,
  }
  return !serverOnly && isHydrated ? (
    <ClientSelect {...mappedProps} />
  ) : (
    <ServerPlaceholder {...mappedProps} />
  )
}

const selectCss = {
  display: 'inline-flex',
  alignItems: 'center',
}

const buttonCss = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border:
    '1px solid color-mix(in oklab, var(--border-color) 80%, var(--text) 20%)',
  backgroundColor:
    'color-mix(in oklab, var(--secondary-bg) 78%, var(--background) 22%)',
  boxShadow: 'inset 0 1px 0 color-mix(in oklab, white 12%, transparent)',
  '&[data-hovered]': {
    backgroundColor:
      'color-mix(in oklab, var(--secondary-bg) 70%, var(--background) 30%)',
  },
  '&[data-pressed]': {
    transform: 'none',
  },
}

const itemCss = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  cursor: 'pointer',
  lineHeight: 'var(--line-height-tight)',
}

const listItemCss = {
  ...itemCss,
}

// react aria includes an `href` key in domProps even when it is `undefined`
// which keeps typescript from being able to narrow the type appropriately on its own
function hasRenderableHref(
  domProps:
    | React.ComponentPropsWithRef<'a'>
    | React.ComponentPropsWithRef<'div'>,
): domProps is React.ComponentPropsWithRef<'a'> & { href: string } {
  return typeof (domProps as { href?: unknown }).href === 'string'
}

function Caret() {
  return (
    <span
      aria-hidden="true"
      css={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <CaretDownIcon />
    </span>
  )
}

function ServerPlaceholder<T extends object>({
  buttonVariant,
  getItemId,
  getItemText,
  items,
  placeholder,
  defaultValue,
  value,
}: SelectProps<T>) {
  let text = placeholder
  const selectedValue = value ?? defaultValue
  if (selectedValue !== undefined) {
    const selectedItem = items.find((item) => getItemId(item) === selectedValue)
    if (selectedItem) {
      text = getItemText(selectedItem)
    }
  }
  return (
    <div css={selectCss}>
      <Button variant={buttonVariant} css={buttonCss}>
        <span css={itemCss}>{text}</span>
        <Caret />
      </Button>
    </div>
  )
}

function ClientSelect<T extends object>({
  items,
  getItemId,
  getItemText,
  renderItem,
  buttonVariant,
  ...props
}: SelectProps<T>) {
  return (
    <RacSelect css={selectCss} {...props}>
      <Button variant={buttonVariant} css={buttonCss}>
        <SelectValue css={itemCss}>
          {({ selectedText }) => (selectedText ? selectedText : undefined)}
        </SelectValue>
        <Caret />
      </Button>
      <Popover placement="bottom start" offset={4}>
        <ListBox items={items} css={{ width: '100%' }}>
          {(item) => (
            <ListBoxItem
              id={getItemId(item)}
              textValue={getItemText(item)}
              render={(domProps, itemProps) => {
                if (hasRenderableHref(domProps)) {
                  return (
                    <a {...domProps} css={listItemCss}>
                      {renderItem
                        ? renderItem(item, itemProps)
                        : getItemText(item)}
                    </a>
                  )
                }

                return (
                  <div {...domProps} css={listItemCss}>
                    {renderItem
                      ? renderItem(item, itemProps)
                      : getItemText(item)}
                  </div>
                )
              }}
            />
          )}
        </ListBox>
      </Popover>
    </RacSelect>
  )
}
