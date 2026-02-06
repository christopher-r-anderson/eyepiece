import { useEffect } from 'react'
import { useId } from 'react-aria'
import { upsertProfile } from '../profile-service'
import type { FormHeadingLevel } from '@/components/ui/forms'
import type { FormDataObject } from '@/components/ui/forms.types'
import { Form, FormHeading, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { profileInputSchema } from '@/lib/schemas/profile.schema'
import { useEvent } from '@/lib/hooks/use-event'

export function UpsertProfileForm({
  headingLevel,
  initialData,
  isDisabled,
  onSuccess,
}: {
  headingLevel: FormHeadingLevel
  initialData?: FormDataObject
  isDisabled?: boolean
  onSuccess: () => void
}) {
  const headingId = useId()

  const [state, formAction, isPending] = useTypedActionState(
    profileInputSchema,
    upsertProfile,
    initialData,
  )

  const onSuccessRef = useEvent(onSuccess)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccessRef.current?.()
    }
  }, [state.status])

  return (
    <Form
      autoComplete="on"
      action={formAction}
      validationErrors={state.fieldErrors}
      formError={state.error}
      aria-labelledby={headingId}
      aria-busy={isPending || undefined}
      controls={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBlockStart: '1rem',
          }}
        >
          <Button
            variant="primary"
            type="submit"
            isDisabled={isDisabled || isPending}
          >
            Update Profile
          </Button>
        </div>
      }
    >
      <FormHeading id={headingId} headingLevel={headingLevel}>
        Create Profile
      </FormHeading>
      <InputGroup>
        <input type="hidden" name="id" defaultValue={state.formData?.id} />
        <TextField
          name="displayName"
          type="text"
          autoComplete="name"
          isRequired
          isDisabled={isDisabled}
          defaultValue={state.formData?.displayName}
          label="Display Name (shown publicly)"
        />
      </InputGroup>
    </Form>
  )
}
