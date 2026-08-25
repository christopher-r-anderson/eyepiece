import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { Dialog, ModalOverlay, Modal as RacModal } from 'react-aria-components'
import { sheet } from 'styled-system/recipes'
import { Button } from './button'
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
            // the close slot's absolute placement loses to the icon
            // variant's positioning context by layer order (recipes beats
            // recipes.slots); the utilities layer beats both
            css={{ position: 'absolute' }}
          >
            <XIcon aria-hidden="true" size={22} weight="bold" />
          </Button>
          <div className={slots.body}>{children}</div>
        </Dialog>
      </RacModal>
    </ModalOverlay>
  )
}
