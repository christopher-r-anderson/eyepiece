import type { ComponentPropsWithoutRef } from 'react'
import type { AssetKey } from '@/domain/asset/asset.schemas'
import type { AssetsRepo } from '@/features/assets/assets-repo'
import { Button } from '@/components/ui/button'
import { MetadataTable } from '@/features/assets/components/metadata'
import { useMetadata } from '@/features/assets/api/asset.queries'
import { ModalDialog } from '@/components/ui/modal-dialog'

export function MetadataModal({
  assetsRepo,
  assetKey,
  isOpen,
  onOpenChange,
}: {
  assetsRepo: Pick<AssetsRepo, 'getMetadata'>
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
        assetsRepo={assetsRepo}
        assetKey={assetKey}
        isOpen={isOpen}
        css={{ minHeight: 0, overflowY: 'auto', padding: '2rem' }}
      />
    </ModalDialog>
  )
}

function MetadataModalContent({
  assetsRepo,
  assetKey,
  isOpen,
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  assetsRepo: Pick<AssetsRepo, 'getMetadata'>
  assetKey: AssetKey
  isOpen: boolean
}) {
  const { data, isLoading, isError, refetch } = useMetadata({
    repo: assetsRepo,
    assetKey,
    enabled: isOpen,
  })

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
