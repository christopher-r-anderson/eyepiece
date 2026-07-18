import { Select as RacSelect, SelectValue } from 'react-aria-components'
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr'
import { css, cx } from 'styled-system/css'
import { select } from 'styled-system/recipes'
import { Button } from './button'
import type {
  ListBoxItemRenderProps,
  SelectProps as RacSelectProps,
} from 'react-aria-components'
import type { StyleProps } from './style-contract'
import { ListBox, ListBoxItem } from '@/components/ui/list-box'
import { Popover } from '@/components/ui/popover'

const slots = select()

type SelectProps<T extends object> = {
  items: Array<T>
  getItemId: (item: T) => string
  // explicit getItemText keeps react aria from extracting text from complex children
  getItemText: (item: T) => string
  renderItem?: (item: T, itemProps?: ListBoxItemRenderProps) => React.ReactNode
} & StyleProps &
  Pick<
    RacSelectProps<T>,
    | 'defaultValue'
    | 'value'
    | 'placeholder'
    | 'onChange'
    | 'style'
    | 'aria-label'
  >

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
    <span aria-hidden="true" className={slots.caret}>
      <CaretDownIcon />
    </span>
  )
}

export function Select<T extends object>({
  items,
  getItemId,
  getItemText,
  renderItem,
  css: cssProp,
  className,
  // defaulted internally so callers always have placeholder text (address when i18n lands)
  placeholder = 'Please select an item',
  ...props
}: SelectProps<T>) {
  return (
    <RacSelect
      placeholder={placeholder}
      {...props}
      className={cx(slots.root, css(cssProp), className)}
    >
      <Button
        css={css.raw({
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border:
            '1px solid color-mix(in oklab, token(colors.border) 80%, token(colors.text) 20%)',
          backgroundColor:
            'color-mix(in oklab, token(colors.secondary.bg) 78%, token(colors.background) 22%)',
          _hovered: {
            backgroundColor:
              'color-mix(in oklab, token(colors.secondary.bg) 70%, token(colors.background) 30%)',
          },
          _pressed: {
            transform: 'none',
          },
        })}
      >
        <SelectValue className={slots.item}>
          {({ selectedText }) => (selectedText ? selectedText : undefined)}
        </SelectValue>
        <Caret />
      </Button>
      <Popover placement="bottom start" offset={4}>
        <ListBox items={items} css={css.raw({ width: '100%' })}>
          {(item) => (
            <ListBoxItem
              id={getItemId(item)}
              textValue={getItemText(item)}
              render={(domProps, itemProps) => {
                const content = renderItem
                  ? renderItem(item, itemProps)
                  : getItemText(item)
                const itemClass = cx(slots.item, domProps.className)

                if (hasRenderableHref(domProps)) {
                  return (
                    <a {...domProps} className={itemClass}>
                      {content}
                    </a>
                  )
                }

                return (
                  <div {...domProps} className={itemClass}>
                    {content}
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
