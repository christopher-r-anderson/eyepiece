import { useEffect } from 'react'
import { toCollectionsResultError } from '../collections.commands'
import { useCreateCollection } from '../collections.queries'
import { createCollectionInputSchema } from '../collections.schema'
import { Form, FormActions, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { Err, Ok } from '@/lib/result'
import { useEvent } from '@/lib/hooks/use-event'

export function CreateCollectionForm({ onSuccess }: { onSuccess: () => void }) {
  const createCollection = useCreateCollection()

  const [state, formAction, isPending] = useTypedActionState(
    createCollectionInputSchema,
    async (input) => {
      try {
        return Ok(await createCollection.mutateAsync(input))
      } catch (error) {
        return Err(toCollectionsResultError(error))
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
      validationErrors={state.fieldErrors}
      formError={state.error}
      aria-busy={isPending || undefined}
      controls={
        <FormActions>
          <Button variant="primary" type="submit" isDisabled={isPending}>
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
