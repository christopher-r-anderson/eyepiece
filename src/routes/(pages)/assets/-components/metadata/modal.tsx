import type { ComponentPropsWithoutRef } from 'react'
import type { AssetKey } from '@/domain/asset/asset.schemas'
import { Button } from '@/components/ui/button'
import { MetadataTable } from '@/features/assets/components/metadata'
import { useMetadata } from '@/features/assets/api/asset.queries'
import { ModalDialog } from '@/components/ui/modal-dialog'
import { useEyepieceClient } from '@/lib/api/eyepiece/eyepiece-client-provider'

export function MetadataModal({
  assetKey,
  isOpen,
  onOpenChange,
}: {
  assetKey: AssetKey
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <ModalDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Metadata"
      isDismissable
    >
      <MetadataModalContent
        assetKey={assetKey}
        isOpen={isOpen}
        css={{ minHeight: 0, overflowY: 'auto', padding: '2rem' }}
      />
    </ModalDialog>
  )
}

function MetadataModalContent({
  assetKey,
  isOpen,
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  assetKey: AssetKey
  isOpen: boolean
}) {
  const eyepieceClient = useEyepieceClient()
  const { data, isLoading, isError, refetch } = useMetadata(
    eyepieceClient,
    assetKey,
    isOpen,
  )

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
