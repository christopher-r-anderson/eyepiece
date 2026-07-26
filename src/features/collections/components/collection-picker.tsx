import { useState } from 'react'
import { CheckIcon, PlusIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { flex, stack } from 'styled-system/patterns'
import {
  useAddCollectionItem,
  useAssetCollectionMembership,
  useCreateCollection,
  useRemoveCollectionItem,
  useUserCollectionsList,
} from '../collections.queries'
import type { Collection } from '../collections.schema'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { TextField } from '@/components/ui/forms'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'

const checkboxCss = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minHeight: 'touchTargetMin',
  paddingInline: '2',
  cursor: 'pointer',
  borderRadius: 'sm',
  _hovered: { backgroundColor: 'bg.surface.2' },
  '&[data-focus-visible]': {
    outline: 'focusRing',
    outlineOffset: '-2px',
  },
  '&[data-disabled]': { opacity: 0.6, cursor: 'default' },
  '& [data-box]': {
    display: 'inline-grid',
    placeItems: 'center',
    width: '16px',
    height: '16px',
    flexShrink: 0,
    border: 'control',
    borderRadius: 'sm',
    color: 'accent.fg',
  },
  '&[data-selected] [data-box]': {
    backgroundColor: 'accent',
    borderColor: 'transparent',
  },
  '& [data-box] svg': { opacity: 0 },
  '&[data-selected] [data-box] svg': { opacity: 1 },
})

export function CollectionPicker({
  userId,
  assetKey,
}: {
  userId: string
  assetKey: AssetKey
}) {
  const collections = useUserCollectionsList(userId)
  const membership = useAssetCollectionMembership({ userId, assetKey })
  const addItem = useAddCollectionItem()
  const removeItem = useRemoveCollectionItem()
  const queueToastMessage = useQueueToastMessage()
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )

  const toggleMembership = async (
    collection: Collection,
    shouldAdd: boolean,
  ) => {
    setPendingIds((prev) => new Set(prev).add(collection.id))
    try {
      if (shouldAdd) {
        await addItem.mutateAsync({ collectionId: collection.id, assetKey })
        queueToastMessage({ title: `Added to ${collection.name}` })
      } else {
        await removeItem.mutateAsync({ collectionId: collection.id, assetKey })
      }
    } catch {
      queueToastMessage({
        title: shouldAdd
          ? `Couldn't add to ${collection.name}`
          : `Couldn't remove from ${collection.name}`,
        description: 'Please try again.',
      })
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(collection.id)
        return next
      })
    }
  }

  return (
    <div
      className={stack({
        gap: '2',
        minWidth: '260px',
        maxWidth: '320px',
        maxHeight: '340px',
        overflowY: 'auto',
        scrollbarThin: true,
        padding: '1',
      })}
    >
      {collections.isPending || membership.isPending ? (
        <p role="status" className={css({ padding: '2' })}>
          Loading collections…
        </p>
      ) : collections.isError || membership.isError ? (
        <p role="alert" className={css({ padding: '2' })}>
          Couldn&apos;t load your collections.
        </p>
      ) : (
        <>
          {collections.data.length === 0 && (
            <p className={css({ padding: '2', color: 'text.muted' })}>
              No collections yet.
            </p>
          )}
          {collections.data.map((collection) => (
            <Checkbox
              key={collection.id}
              className={checkboxCss}
              isSelected={membership.data.includes(collection.id)}
              // guard instead of isDisabled: disabling the focused control
              // strands keyboard focus on body mid multi-add
              onChange={(isSelected) => {
                if (pendingIds.has(collection.id)) {
                  return
                }
                void toggleMembership(collection, isSelected)
              }}
            >
              <span data-box aria-hidden="true">
                <CheckIcon size={12} weight="bold" />
              </span>
              <span
                className={css({
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                })}
              >
                {collection.name}
              </span>
            </Checkbox>
          ))}
          <InlineCreate assetKey={assetKey} />
        </>
      )}
    </div>
  )
}

function InlineCreate({ assetKey }: { assetKey: AssetKey }) {
  const createCollection = useCreateCollection()
  const addItem = useAddCollectionItem()
  const queueToastMessage = useQueueToastMessage()
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!isCreating) {
    return (
      <Button
        variant="bare"
        onPress={() => setIsCreating(true)}
        className={css({
          justifyContent: 'flex-start',
          gap: '2',
          minHeight: 'touchTargetMin',
          paddingInline: '2',
          color: 'accent.emphasis',
        })}
      >
        <PlusIcon size={16} /> New collection
      </Button>
    )
  }

  const submit = async () => {
    if (isSaving || name.trim().length === 0) {
      return
    }
    setIsSaving(true)
    let created
    try {
      created = await createCollection.mutateAsync({
        name: name.trim(),
        visibility: isPublic ? 'public' : 'private',
      })
    } catch {
      queueToastMessage({
        title: "Couldn't create the collection",
        description: 'Please try again.',
      })
      setIsSaving(false)
      return
    }
    // the collection now exists either way; a failed add must not claim
    // the create failed (retrying would duplicate it)
    setIsCreating(false)
    setName('')
    setIsPublic(false)
    setIsSaving(false)
    try {
      await addItem.mutateAsync({ collectionId: created.id, assetKey })
      queueToastMessage({ title: `Added to ${created.name}` })
    } catch {
      queueToastMessage({
        title: `Couldn't add to ${created.name}`,
        description: 'The collection was created. Please try again.',
      })
    }
  }

  return (
    <form
      className={stack({ gap: '2', padding: '2' })}
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <TextField
        name="name"
        type="text"
        label="Name"
        isRequired
        autoFocus
        value={name}
        onChange={setName}
      />
      <Switch isSelected={isPublic} onChange={setIsPublic}>
        Public collection
      </Switch>
      <div className={flex({ justifyContent: 'flex-end', gap: '2' })}>
        <Button
          variant="secondary"
          isDisabled={isSaving}
          onPress={() => setIsCreating(false)}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          isPending={isSaving}
          css={css.raw({
            '&[data-pending]': {
              cursor: 'default',
              opacity: 0.7,
              color: 'accent.fg.muted',
            },
          })}
        >
          Create and add
        </Button>
      </div>
    </form>
  )
}
