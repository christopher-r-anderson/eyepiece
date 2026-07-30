import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { Dialog, ModalOverlay, Modal as RacModal } from 'react-aria-components'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { modalDialog } from 'styled-system/recipes'
import { Button } from './button'
import { Heading } from './heading'
import { useModalOpenAttribute } from './modal-open-attribute'
import type { HeadingLevel } from './heading'
import type { ReactNode } from 'react'

const slots = modalDialog()

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
  useModalOpenAttribute(isOpen)

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
                // dialogs are panels; their titles take the section voice
                textStyle: 'title.md',
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
                  backgroundColor: 'bg.surface.3',
                  opacity: 1,
                },
                '&[data-focus-visible], &[data-pressed]': {
                  opacity: 1,
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
