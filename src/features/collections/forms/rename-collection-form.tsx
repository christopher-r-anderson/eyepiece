import { useEffect } from 'react'
import { css } from 'styled-system/css'
import { toCollectionsResultError } from '../collections.commands'
import { CollectionsErrorCodes } from '../collections.const'
import { useRenameCollection } from '../collections.queries'
import { renameCollectionInputSchema } from '../collections.schema'
import type { Collection } from '../collections.schema'
import { Form, FormActions, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { Err, Ok } from '@/lib/result'
import { useEvent } from '@/lib/hooks/use-event'

// server failures carry internal codes as their messages; the form always
// substitutes human copy
function toRenameCollectionFormError(error: unknown) {
  const resultError = toCollectionsResultError(error)
  return {
    ...resultError,
    message:
      resultError.code === CollectionsErrorCodes.AUTH_REQUIRED
        ? 'Your session has ended. Log in and try again.'
        : "Couldn't rename the collection. Please try again.",
  }
}

export function RenameCollectionForm({
  collection,
  onSuccess,
}: {
  collection: Collection
  onSuccess?: () => void
}) {
  const renameCollection = useRenameCollection()

  const [state, formAction, isPending] = useTypedActionState(
    renameCollectionInputSchema,
    async (input) => {
      try {
        return Ok(await renameCollection.mutateAsync(input))
      } catch (error) {
        return Err(toRenameCollectionFormError(error))
      }
    },
  )

  const onSuccessRef = useEvent(onSuccess)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccessRef.current?.()
    }
  }, [state.status])

  return (
    <Form
      action={formAction}
      // the pending button blocks clicks but not Enter's implicit submit,
      // which React would queue into a second rename
      onSubmit={(event) => {
        if (isPending) {
          event.preventDefault()
        }
      }}
      validationErrors={state.fieldErrors}
      formError={state.error}
      aria-busy={isPending || undefined}
      controls={
        <FormActions>
          <Button
            variant="primary"
            type="submit"
            isPending={isPending}
            css={css.raw({
              '&[data-pending]': {
                cursor: 'default',
                opacity: 0.7,
                color: 'accent.fg.muted',
              },
            })}
          >
            Rename
          </Button>
        </FormActions>
      }
    >
      <InputGroup>
        <input type="hidden" name="collectionId" value={collection.id} />
        <TextField
          name="name"
          type="text"
          isRequired
          label="Name"
          // key by the settled name so a successful rename re-seeds the
          // field while an error round trip keeps the draft
          key={collection.name}
          defaultValue={state.formData?.name ?? collection.name}
        />
      </InputGroup>
    </Form>
  )
}
