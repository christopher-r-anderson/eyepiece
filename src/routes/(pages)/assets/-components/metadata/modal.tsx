import { Suspense } from 'react'
import { CatchBoundary } from '@tanstack/react-router'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { MetadataTable } from '@/features/assets/components/metadata'
import { useSuspenseMetadata } from '@/features/assets/assets.queries'
import { ModalDialog } from '@/components/ui/modal-dialog'
import { toAssetKeyString } from '@/domain/asset/asset.utils'
import { CapturedAlertError } from '@/app/layout/route-error'

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
      <CatchBoundary
        getResetKey={() => toAssetKeyString(assetKey)}
        errorComponent={({ error }) => (
          <CapturedAlertError error={error} message="Couldn't load metadata." />
        )}
      >
        <Suspense fallback={<p role="status">Loading metadata…</p>}>
          <MetadataModalContent assetKey={assetKey} />
        </Suspense>
      </CatchBoundary>
    </ModalDialog>
  )
}

function MetadataModalContent({ assetKey }: { assetKey: AssetKey }) {
  const { data } = useSuspenseMetadata(assetKey)

  if (Object.keys(data).length === 0) {
    return <p>No metadata was found.</p>
  }

  return (
    <div>
      <MetadataTable data={data} />
    </div>
  )
}
