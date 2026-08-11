import { ClientOnly } from '@tanstack/react-router'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger, Popover } from '@/components/ui/popover'
import { CollectionPicker } from '@/features/collections/components/collection-picker'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { useShowLoginModal } from '@/features/auth/hooks/use-show-auth-modal'

type TriggerVariant = 'tile' | 'detail'

const tileTriggerCss = css.raw({
  color: 'text.muted',
  _hovered: { color: 'accent.emphasis' },
})

// the detail action row speaks in prose controls (the mockups' text-btn
// voice), so the trigger is an icon-and-label line, not a boxed button
const detailTriggerCss = css.raw({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  minHeight: 'touchTargetMin',
  borderBottom: '[none]',
  fontWeight: 'regular',
  color: 'text.muted',
  _hovered: { color: 'text', borderBottomColor: 'transparent' },
})

function TriggerButton({
  variant,
  isDisabled,
  onPress,
}: {
  variant: TriggerVariant
  isDisabled?: boolean
  onPress?: () => void
}) {
  const shared = {
    'aria-label': 'Add to collection',
    isDisabled,
    onPress,
  }
  if (variant === 'tile') {
    return (
      <Button {...shared} variant="icon" css={tileTriggerCss}>
        <PlusIcon size={20} />
      </Button>
    )
  }
  return (
    <Button {...shared} variant="text" css={detailTriggerCss}>
      <PlusIcon size={20} />
      collect
    </Button>
  )
}

export function AddToCollectionButton({
  assetKey,
  variant,
}: {
  assetKey: AssetKey
  variant: TriggerVariant
}) {
  return (
    <ClientOnly fallback={<TriggerButton variant={variant} isDisabled />}>
      <AddToCollectionButtonContent assetKey={assetKey} variant={variant} />
    </ClientOnly>
  )
}

function AddToCollectionButtonContent({
  assetKey,
  variant,
}: {
  assetKey: AssetKey
  variant: TriggerVariant
}) {
  const { data: user, isPending } = useCurrentUserQuery()
  const showLoginModal = useShowLoginModal()

  // the always-visible-prompt pattern the favorite star uses: logged out
  // still sees the control, pressing it asks for a login
  if (!user) {
    return (
      <TriggerButton
        variant={variant}
        isDisabled={isPending}
        onPress={showLoginModal}
      />
    )
  }

  return (
    <DialogTrigger>
      <TriggerButton variant={variant} />
      <Popover placement="bottom start" containerPadding={20}>
        <Dialog
          aria-label="Add to collection"
          // invisible, not none: forced-colors mode keeps a focus indicator
          className={css({
            outline: '[2px solid transparent]',
            outlineOffset: '[2px]',
          })}
        >
          <CollectionPicker
            userId={user.id}
            assetKey={assetKey}
            onAuthRequired={showLoginModal}
          />
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}
