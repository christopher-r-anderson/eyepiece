import { XIcon } from '@phosphor-icons/react/dist/ssr'
import {
  Dialog,
  Heading,
  ModalOverlay,
  Modal as RacModal,
} from 'react-aria-components'
import { useId } from 'react-aria'
import { useEffect } from 'react'
import { css } from 'styled-system/css'
import { Button } from './button'
import type { ReactNode } from 'react'

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
}

export function ModalDialog({
  children,
  isDismissable,
  isOpen,
  onOpenChange,
  title,
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
      className={css({
        position: 'fixed',
        inset: 0,
        zIndex: 'overlay',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <RacModal className={css({ maxHeight: '100vh', padding: '6' })}>
        <Dialog
          aria-labelledby={titleId}
          className={css({
            backgroundColor: 'background',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            maxWidth: '90vw',
            border: '1px solid token(colors.border)',
            borderRadius: 'lg',
            boxShadow: 'overlay',
            overflow: 'hidden',
          })}
        >
          <div
            className={css({
              display: 'flex',
              justifyContent: 'space-between',
              gap: '3',
              alignItems: 'center',
              paddingTop: '4',
              paddingInline: '5',
              paddingBottom: '3',
            })}
          >
            <Heading
              id={titleId}
              slot="title"
              className={css({
                flex: '1 1 auto',
                marginBlockEnd: 0,
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
                transitionProperty: 'background-color, color, opacity',
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
          <div
            className={css({
              minHeight: 0,
              overflowY: 'auto',
              paddingTop: 0,
              paddingInline: '5',
              paddingBottom: '5',
            })}
          >
            {children}
          </div>
        </Dialog>
      </RacModal>
    </ModalOverlay>
  )
}
