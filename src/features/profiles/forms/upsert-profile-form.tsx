import { useEffect } from 'react'
import { useId } from 'react-aria'
import { useProfilesCommands } from '../profiles.commands'
import type { HeadingLevel } from '@/components/ui/heading'
import type { FormDataObject } from '@/components/ui/forms.types'
import { Heading } from '@/components/ui/heading'
import { Form, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { profileSchema } from '@/domain/profile/profile.schema'
import { useEvent } from '@/lib/hooks/use-event'

type ActionType = 'create' | 'update'

export function UpsertProfileForm({
  actionType,
  headingLevel,
  initialData,
  isDisabled,
  onSuccess,
}: {
  actionType: ActionType
  headingLevel: HeadingLevel
  initialData?: FormDataObject
  isDisabled?: boolean
  onSuccess: () => void
}) {
  const headingId = useId()
  const profilesCommands = useProfilesCommands()

  const [state, formAction, isPending] = useTypedActionState(
    profileSchema,
    profilesCommands.upsertProfile,
    initialData,
  )

  const onSuccessRef = useEvent(onSuccess)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccessRef.current?.()
    }
  }, [state.status])

  const isUpdating = actionType === 'update' && !!state.formData?.displayName

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
            {isUpdating ? 'Update' : 'Create'}
          </Button>
        </div>
      }
    >
      <Heading id={headingId} headingLevel={headingLevel}>
        {isUpdating ? 'Update Profile' : 'Create Profile'}
      </Heading>
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
