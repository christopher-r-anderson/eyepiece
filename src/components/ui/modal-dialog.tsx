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
        zIndex: 'var(--z-overlay)',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RacModal css={{ maxHeight: '100vh', padding: 'var(--space-6)' }}>
        <Dialog
          aria-labelledby={titleId}
          css={{
            backgroundColor: 'var(--background)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            maxWidth: '90vw',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-overlay)',
            overflow: 'hidden',
          }}
        >
          <div
            css={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              alignItems: 'center',
              padding: 'var(--space-4) var(--space-5) var(--space-3)',
            }}
          >
            <Heading
              id={titleId}
              slot="title"
              css={{
                flex: '1 1 auto',
                marginBlockEnd: 0,
                minWidth: 0,
              }}
            >
              {title}
            </Heading>

            <Button
              aria-label={`Close ${title} dialog`}
              onPress={() => onOpenChange(false)}
              css={{
                display: 'inline-flex',
                alignItems: 'center',
                width: 'var(--size-touch-target-min)',
                height: 'var(--size-touch-target-min)',
                cursor: 'pointer',
                justifyContent: 'center',
                padding: 0,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                color: 'var(--text)',
                opacity: 0.8,
                flexShrink: 0,
                transition:
                  'background-color var(--transition-fast), color var(--transition-fast), opacity var(--transition-fast)',
                '&[data-hovered]': {
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--text)',
                  opacity: 1,
                },
                '&[data-focus-visible], &[data-pressed]': {
                  opacity: 1,
                },
                '&[data-focus-visible]': {
                  outline: '1px solid var(--outline-color)',
                  outlineOffset: '2px',
                },
              }}
            >
              <XIcon size={18} weight="bold" />
            </Button>
          </div>
          <div
            css={{
              minHeight: 0,
              overflowY: 'auto',
              padding: '0 var(--space-5) var(--space-5)',
            }}
          >
            {children}
          </div>
        </Dialog>
      </RacModal>
    </ModalOverlay>
  )
}
