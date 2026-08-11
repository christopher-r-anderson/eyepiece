import { Suspense } from 'react'
import { CaretRightIcon } from '@phosphor-icons/react/dist/ssr'
import { usePrefetchMetadata, useSuspenseMetadata } from '../assets.queries'
import { MetadataTable } from './metadata'
import type { ReactNode } from 'react'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { HeadingLevel } from '@/components/ui/heading'
import { Disclosure, DisclosurePanel } from '@/components/ui/disclosure'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { LoadingNotice } from '@/components/loading-notice'

export function MetadataDisclosure({
  assetKey,
  headingLevel,
  errorBoundary,
}: {
  assetKey: AssetKey
  headingLevel: HeadingLevel
  // boundaries stay consumer-side per convention
  errorBoundary: (children: ReactNode) => ReactNode
}) {
  // NOTE: this gets spammed on every hover/focus/press - add throttle if
  // staleTime is removed
  const prefetch = usePrefetchMetadata(assetKey)
  return (
    <Disclosure>
      {({ isExpanded }) => (
        <>
          <Heading level={headingLevel}>
            <Button
              slot="trigger"
              variant="bare"
              onHoverStart={prefetch}
              onFocus={prefetch}
              css={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
                minHeight: 'touchTargetMin',
                color: 'text.muted',
                fontSize: 'base',
                fontWeight: 'semibold',
                _hovered: { color: 'text' },
                '& svg': { transitionFast: 'rotate' },
                '&[aria-expanded="true"] svg': { rotate: '[90deg]' },
              }}
            >
              <CaretRightIcon aria-hidden="true" size={16} weight="bold" />
              Metadata
            </Button>
          </Heading>
          <DisclosurePanel>
            {isExpanded &&
              errorBoundary(
                <Suspense
                  fallback={<LoadingNotice>Loading metadata…</LoadingNotice>}
                >
                  <MetadataContent assetKey={assetKey} />
                </Suspense>,
              )}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}

function MetadataContent({ assetKey }: { assetKey: AssetKey }) {
  const { data } = useSuspenseMetadata(assetKey)

  if (Object.keys(data).length === 0) {
    return <p>No metadata was found.</p>
  }

  return <MetadataTable data={data} />
}
