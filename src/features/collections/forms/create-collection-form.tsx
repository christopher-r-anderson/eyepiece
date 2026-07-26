import { useEffect } from 'react'
import { toCollectionsResultError } from '../collections.commands'
import { CollectionsErrorCodes } from '../collections.const'
import { useCreateCollection } from '../collections.queries'
import { createCollectionInputSchema } from '../collections.schema'
import { Form, FormActions, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { Err, Ok } from '@/lib/result'
import { useEvent } from '@/lib/hooks/use-event'

// server failures carry internal codes as their messages (AUTH_REQUIRED,
// UNKNOWN_ERROR); the form always substitutes human copy
function toCreateCollectionFormError(error: unknown) {
  const resultError = toCollectionsResultError(error)
  return {
    ...resultError,
    message:
      resultError.code === CollectionsErrorCodes.AUTH_REQUIRED
        ? 'Your session has ended. Log in and try again.'
        : "Couldn't create the collection. Please try again.",
  }
}

export function CreateCollectionForm({ onSuccess }: { onSuccess: () => void }) {
  const createCollection = useCreateCollection()

  const [state, formAction, isPending] = useTypedActionState(
    createCollectionInputSchema,
    async (input) => {
      try {
        return Ok(await createCollection.mutateAsync(input))
      } catch (error) {
        return Err(toCreateCollectionFormError(error))
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
      isPending={isPending}
      validationErrors={state.fieldErrors}
      formError={state.error}
      controls={
        <FormActions>
          <Button
            variant="primary"
            type="submit"
            // isPending, not isDisabled: disabling the focused button strands
            // focus on body (Chrome fires no blur), leaving Escape unable to
            // reach the modal; pending keeps focus while blocking interaction
            isPending={isPending}
          >
            Create
          </Button>
        </FormActions>
      }
    >
      <InputGroup>
        <TextField
          name="name"
          type="text"
          isRequired
          autoFocus
          label="Name"
          defaultValue={state.formData?.name}
        />
      </InputGroup>
      {/* unchecked, the field is absent from the form data and the schema
          default keeps the collection private */}
      <Switch
        name="visibility"
        value="public"
        defaultSelected={state.formData?.visibility === 'public'}
      >
        Public collection
      </Switch>
    </Form>
  )
}
