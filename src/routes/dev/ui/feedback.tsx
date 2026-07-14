import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { css } from 'styled-system/css'
import { grid, wrap } from 'styled-system/patterns'
import { DevPanel, DevTitleBlock, devPageSectionCss } from '../-components'
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
    <div className={css(devPageSectionCss)}>
      <DevPanel css={css.raw({ padding: '4' })}>
        <DevTitleBlock
          title="Feedback"
          description="Use this page to trigger overlays and transient UI."
        />

        <div className={wrap({ align: 'center', gap: '3' })}>
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
      </DevPanel>

      <ModalDialog
        title="UI workbench modal"
        isDismissable
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      >
        <div className={grid({ gap: '3' })}>
          <p>
            Preview modal spacing, close controls, and responsive constraints.
          </p>
          <Button onPress={() => setIsModalOpen(false)}>Close modal</Button>
        </div>
      </ModalDialog>
    </div>
  )
}
