import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { Dialog, ModalOverlay, Modal as RacModal } from 'react-aria-components'
import { css } from 'styled-system/css'
import { sheet } from 'styled-system/recipes'
import { Button } from './button'
import { useModalOpenAttribute } from './modal-open-attribute'
import type { ReactNode } from 'react'

const slots = sheet()

export function Sheet({
  children,
  isOpen,
  onOpenChange,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  'aria-label': string
}) {
  useModalOpenAttribute(isOpen)
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className={slots.overlay}
    >
      <RacModal className={slots.modal}>
        <Dialog aria-label={ariaLabel} className={slots.dialog}>
          <Button
            aria-label={`Close ${ariaLabel}`}
            onPress={() => onOpenChange(false)}
            variant="icon"
            className={slots.close}
            // every property the icon variant also sets (position, colors,
            // hover background) loses in the close slot by layer order
            // (recipes beats recipes.slots); the utilities layer beats
            // both. Over the dimmed backdrop the glyph stays light and
            // hover speaks through color alone
            css={css.raw({
              position: 'absolute',
              color: 'rgba(255, 255, 255, 0.8)',
              _hovered: {
                backgroundColor: 'transparent',
                color: 'white',
              },
            })}
          >
            <XIcon aria-hidden="true" size={22} weight="bold" />
          </Button>
          <div className={slots.body}>{children}</div>
        </Dialog>
      </RacModal>
    </ModalOverlay>
  )
}
