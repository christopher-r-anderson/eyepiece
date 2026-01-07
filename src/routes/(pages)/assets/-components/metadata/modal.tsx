import { useMetadata } from '@/features/assets/api/asset-queries'
import { MetadataTable } from '@/features/assets/components/metadata'
import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { ComponentPropsWithoutRef } from 'react'
import {
  ModalOverlay,
  Modal,
  Dialog,
  Heading,
  Button,
} from 'react-aria-components'

export function MetadataModal({
  id,
  isOpen,
  onOpenChange,
}: {
  id: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      css={{
        position: 'fixed',
        inset: 0,
        zIndex: Infinity,
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <Modal css={{ height: '100%', padding: '2rem' }}>
        <Dialog
          aria-labelledby="metadata-title"
          css={{
            backgroundColor: 'var(--background)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            height: '100%',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
              padding: '2rem',
            }}
          >
            <Heading id="metadata-title" slot="title">
              Metadata
            </Heading>

            <Button
              aria-label="Close metadata dialog"
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

          <MetadataModalContent
            assetId={id}
            isOpen={isOpen}
            css={{ minHeight: 0, overflowY: 'auto', padding: '2rem' }}
          />
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

function MetadataModalContent({
  assetId,
  isOpen,
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  assetId: string
  isOpen: boolean
}) {
  const { data, isLoading, isError, refetch } = useMetadata(assetId, isOpen)

  if (isLoading)
    return (
      <div {...props}>
        <p role="status">Loading metadata…</p>
      </div>
    )

  if (isError) {
    return (
      <div {...props}>
        <p role="alert">Couldn't load metadata.</p>
        <Button onPress={() => refetch()}>Retry</Button>
      </div>
    )
  }

  if (!data || Object.keys(data).length === 0) {
    return <p>No metadata was found.</p>
  }

  return (
    <div {...props}>
      <MetadataTable data={data} />
    </div>
  )
}
