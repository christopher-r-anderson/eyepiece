import { XIcon } from '@phosphor-icons/react/dist/ssr'
import {
  Button,
  Dialog,
  Heading,
  ModalOverlay,
  Modal as RacModal,
} from 'react-aria-components'
import { useId } from 'react-aria'
import type { ReactNode } from 'react'

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
  // Note: gap on sides of overlay on chrome due to its handling of scrollbar gutters and react aria components not using dialog (for compatibility)
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      css={{
        position: 'fixed',
        inset: 0,
        zIndex: Infinity,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RacModal css={{ maxHeight: '100vh', padding: '2rem' }}>
        <Dialog
          aria-labelledby={titleId}
          css={{
            backgroundColor: 'var(--background)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: '90vh',
            maxWidth: '90vw',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
              padding: '0 1rem',
            }}
          >
            <Heading id={titleId} slot="title">
              {title}
            </Heading>

            <Button
              aria-label={`Close ${title} dialog`}
              onPress={() => onOpenChange(false)}
              css={{
                display: 'inline-flex',
                alignItems: 'center',
                width: 32,
                height: 32,
                cursor: 'pointer',
                justifyContent: 'center',
              }}
            >
              <XIcon />
            </Button>
          </div>
          <div css={{ minHeight: 0, overflowY: 'auto', padding: '1rem' }}>
            {children}
          </div>
        </Dialog>
      </RacModal>
    </ModalOverlay>
  )
}
