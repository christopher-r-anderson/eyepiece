import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { Dialog, ModalOverlay, Modal as RacModal } from 'react-aria-components'
import { useId } from 'react-aria'
import { useEffect } from 'react'
import { css } from 'styled-system/css'
import { modalDialog } from 'styled-system/recipes'
import { Button } from './button'
import { Heading } from './heading'
import type { HeadingLevel } from './heading'
import type { ReactNode } from 'react'

const slots = modalDialog()

const MODAL_OPEN_ATTRIBUTE = 'data-modal-open'

let openModalCount = 0

function syncModalOpenAttribute() {
  if (typeof document === 'undefined') {
    return
  }

  if (openModalCount > 0) {
    document.documentElement.setAttribute(MODAL_OPEN_ATTRIBUTE, 'true')
  } else {
    document.documentElement.removeAttribute(MODAL_OPEN_ATTRIBUTE)
  }
}

export type ModalDialogProps = {
  children: ReactNode
  isDismissable?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  titleLevel?: HeadingLevel
}

export function ModalDialog({
  children,
  isDismissable,
  isOpen,
  onOpenChange,
  title,
  titleLevel = 2,
}: ModalDialogProps) {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) {
      return
    }

    openModalCount += 1
    syncModalOpenAttribute()

    return () => {
      openModalCount = Math.max(0, openModalCount - 1)
      syncModalOpenAttribute()
    }
  }, [isOpen])

  // Note: gap on sides of overlay on chrome due to its handling of scrollbar gutters and react aria components not using dialog (for compatibility)
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      className={slots.overlay}
    >
      <RacModal className={slots.modal}>
        <Dialog aria-labelledby={titleId} className={slots.dialog}>
          <div className={slots.header}>
            <Heading
              level={titleLevel}
              id={titleId}
              css={css.raw({
                flex: '1 1 auto',
                minWidth: 0,
              })}
            >
              {title}
            </Heading>

            <Button
              aria-label={`Close ${title} dialog`}
              onPress={() => onOpenChange(false)}
              variant="bare"
              css={css.raw({
                width: 'touchTargetMin',
                height: 'touchTargetMin',
                color: 'text',
                opacity: 0.8,
                flexShrink: 0,
                transitionFast: 'background-color, color, opacity',
                _hovered: {
                  backgroundColor: 'tertiary.bg',
                  opacity: 1,
                },
                '&[data-focus-visible], &[data-pressed]': {
                  opacity: 1,
                },
                _pressed: {
                  transform: 'none',
                },
                _focusVisible: {
                  outlineOffset: '2px',
                },
              })}
            >
              <XIcon aria-hidden="true" size={18} weight="bold" />
            </Button>
          </div>
          <div className={slots.body}>{children}</div>
        </Dialog>
      </RacModal>
    </ModalOverlay>
  )
}
