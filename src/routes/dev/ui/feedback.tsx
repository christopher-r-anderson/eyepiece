import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ModalDialog } from '@/components/ui/modal-dialog'
import { Button } from '@/components/ui/button'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'

export const Route = createFileRoute('/dev/ui/feedback')({
  component: DevUiFeedbackPage,
})

function DevUiFeedbackPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queueToast = useQueueToastMessage()

  return (
    <div css={{ display: 'grid', gap: 'var(--space-section-gap)' }}>
      <section
        css={{
          display: 'grid',
          gap: 'var(--space-4)',
          padding: 'var(--space-4)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div css={{ display: 'grid', gap: 'var(--space-2)' }}>
          <h2 css={{ margin: 0, fontSize: 'var(--text-xl)' }}>Feedback</h2>
          <p css={{ margin: 0, maxWidth: 'var(--size-reading-max)' }}>
            Use this page to trigger overlays and transient UI.
          </p>
        </div>

        <div
          css={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <Button onPress={() => setIsModalOpen(true)}>Open modal</Button>
          <Button
            variant="primary"
            onPress={() =>
              queueToast({
                title: 'Toast preview',
                description:
                  'This uses the existing shared toast setup so we can review content length and spacing.',
              })
            }
          >
            Queue toast
          </Button>
        </div>
      </section>

      <ModalDialog
        title="UI workbench modal"
        isDismissable
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      >
        <div css={{ display: 'grid', gap: 'var(--space-3)' }}>
          <p css={{ margin: 0 }}>
            Preview modal spacing, close controls, and responsive constraints.
          </p>
          <Button onPress={() => setIsModalOpen(false)}>Close modal</Button>
        </div>
      </ModalDialog>
    </div>
  )
}
