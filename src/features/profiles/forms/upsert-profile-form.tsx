import { useEffect } from 'react'
import { useId } from 'react-aria'
import { useProfilesCommands } from '../profiles.commands'
import { upsertProfileFormAction } from '../profiles.form-actions'
import type { HeadingLevel } from '@/components/ui/heading'
import type { FormDataObject } from '@/components/ui/forms.types'
import type { FormProps } from '@/components/ui/forms'
import { Heading } from '@/components/ui/heading'
import { Form, FormActions, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import {
  useHydratedFormSubmit,
  useTypedActionState,
} from '@/components/ui/forms.hooks'
import { profileSchema } from '@/domain/profile/profile.schema'
import { useEvent } from '@/lib/hooks/use-event'

type ActionType = 'create' | 'update'

export function UpsertProfileForm({
  actionType,
  headingLevel,
  initialData,
  initialFormError,
  isDisabled,
  next,
  onSuccess,
  surface,
}: {
  actionType: ActionType
  headingLevel: HeadingLevel
  initialData?: FormDataObject
  initialFormError?: string
  isDisabled?: boolean
  next?: string
  onSuccess: () => void
  surface?: FormProps['surface']
}) {
  const headingId = useId()
  const profilesCommands = useProfilesCommands()

  const [state, formAction, isPending] = useTypedActionState(
    profileSchema,
    profilesCommands.upsertProfile,
    initialData,
  )
  const onHydratedSubmit = useHydratedFormSubmit(formAction)

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
      action={upsertProfileFormAction.url}
      method="post"
      onSubmit={onHydratedSubmit}
      validationErrors={state.fieldErrors}
      formError={
        state.error ?? (state.status === 'idle' ? initialFormError : undefined)
      }
      surface={surface}
      aria-labelledby={headingId}
      isPending={isPending}
      controls={
        <FormActions>
          <Button
            variant="primary"
            type="submit"
            isDisabled={isDisabled}
            isPending={isPending}
          >
            {isUpdating ? 'Update' : 'Create'}
          </Button>
        </FormActions>
      }
    >
      <Heading id={headingId} level={headingLevel}>
        {isUpdating ? 'Update Profile' : 'Create Profile'}
      </Heading>
      <InputGroup>
        <input type="hidden" name="id" defaultValue={state.formData?.id} />
        <input
          type="hidden"
          name="context"
          value={actionType === 'create' ? 'complete' : 'settings'}
        />
        {next && <input type="hidden" name="next" defaultValue={next} />}
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
