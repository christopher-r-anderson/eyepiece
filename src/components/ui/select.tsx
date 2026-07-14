import { Select as RacSelect, SelectValue } from 'react-aria-components'
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr'
import { css, cx } from 'styled-system/css'
import { Button } from './button'
import type { ButtonProps } from './button'
import type {
  ListBoxItemRenderProps,
  SelectProps as RacSelectProps,
} from 'react-aria-components'
import type { SystemStyleObject } from 'styled-system/types'
import { ListBox, ListBoxItem } from '@/components/ui/list-box'
import { Popover } from '@/components/ui/popover'

type SelectProps<T extends object> = {
  items: Array<T>
  getItemId: (item: T) => string
  // explicit getItemText keeps react aria from extracting text from complex children
  getItemText: (item: T) => string
  renderItem?: (item: T, itemProps?: ListBoxItemRenderProps) => React.ReactNode
  buttonVariant?: ButtonProps['variant']
  css?: SystemStyleObject
  className?: string
} & Pick<
  RacSelectProps<T>,
  'defaultValue' | 'value' | 'placeholder' | 'onChange' | 'style' | 'aria-label'
>

const selectStyles = css.raw({
  display: 'inline-flex',
  alignItems: 'center',
})

const buttonStyles = css.raw({
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
})

const itemStyles = css.raw({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  cursor: 'pointer',
  lineHeight: 'tight',
})

const listItemStyles = css.raw({
  ...itemStyles,
})

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
      className={css({
        display: 'inline-flex',
        alignItems: 'center',
      })}
    >
      <CaretDownIcon />
    </span>
  )
}

export function Select<T extends object>({
  items,
  getItemId,
  getItemText,
  renderItem,
  buttonVariant,
  css: cssProp,
  className,
  // defaulted internally so callers always have placeholder text (address when i18n lands)
  placeholder = 'Please select an item',
  ...props
}: SelectProps<T>) {
  return (
    <RacSelect
      className={cx(css(selectStyles, cssProp), className)}
      placeholder={placeholder}
      {...props}
    >
      <Button variant={buttonVariant} css={buttonStyles}>
        <SelectValue className={css(itemStyles)}>
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
                if (hasRenderableHref(domProps)) {
                  return (
                    <a
                      {...domProps}
                      className={cx(css(listItemStyles), domProps.className)}
                    >
                      {renderItem
                        ? renderItem(item, itemProps)
                        : getItemText(item)}
                    </a>
                  )
                }

                return (
                  <div
                    {...domProps}
                    className={cx(css(listItemStyles), domProps.className)}
                  >
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
