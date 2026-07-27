import { Suspense } from 'react'
import { CaretRightIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { usePrefetchMetadata, useSuspenseMetadata } from '../assets.queries'
import { MetadataTable } from './metadata'
import type { ReactNode } from 'react'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { HeadingLevel } from '@/components/ui/heading'
import { Disclosure, DisclosurePanel } from '@/components/ui/disclosure'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'

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
    <Disclosure
      className={css({
        width: '100%',
        maxWidth: 'contentMax',
        marginInline: 'auto',
        paddingInline: '4',
      })}
    >
      {({ isExpanded }) => (
        <>
          <Heading level={headingLevel}>
            <Button
              slot="trigger"
              variant="bare"
              onHoverStart={prefetch}
              onFocus={prefetch}
              css={css.raw({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
                minHeight: 'touchTargetMin',
                color: 'text.muted',
                fontSize: 'base',
                fontWeight: 600,
                _hovered: { color: 'text' },
                _focusVisible: {
                  outline: 'focusRing',
                  outlineOffset: '2px',
                },
                '& svg': { transitionFast: 'rotate' },
                '&[aria-expanded="true"] svg': { rotate: '90deg' },
              })}
            >
              <CaretRightIcon aria-hidden="true" size={16} weight="bold" />
              Metadata
            </Button>
          </Heading>
          <DisclosurePanel>
            {isExpanded &&
              errorBoundary(
                <Suspense fallback={<p role="status">Loading metadata…</p>}>
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
