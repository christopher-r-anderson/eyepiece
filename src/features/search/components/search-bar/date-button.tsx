import {
  CalendarMinusIcon,
  CalendarPlusIcon,
  CalendarBlankIcon,
} from '@phosphor-icons/react/dist/ssr'
import { ToggleButtonProps, ToggleButton } from 'react-aria-components'

export function DateButton(props: ToggleButtonProps) {
  return (
    <ToggleButton
      aria-label="Toggle Year Range"
      css={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '1em',
        background: 'var(--primary-background)',
        color: 'var(--primary-text)',
        padding: '0.25em 0.5em',
        border: '1px solid var(--border-color)',
        borderRadius: '0.25em',
        '&[data-selected]': {
          background: 'var(--secondary-bg)',
          color: 'var(--secondary-text)',
        },
        '&[data-pressed]': {
          color: 'var(--primary-muted)',
        },
        '&[data-selected][data-hovered]': {
          border: '1px solid white',
        },
      }}
      {...props}
    >
      {({ isHovered, isSelected }) =>
        isHovered ? (
          isSelected ? (
            <CalendarMinusIcon />
          ) : (
            <CalendarPlusIcon />
          )
        ) : (
          <CalendarBlankIcon />
        )
      }
    </ToggleButton>
  )
}
