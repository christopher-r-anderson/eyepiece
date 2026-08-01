import { useEffect } from 'react'
import { useId } from 'react-aria'
import { useProfilesCommands } from '../profiles.commands'
import { upsertProfileFormAction } from '../profiles.form-actions'
import type { HeadingLevel } from '@/components/ui/heading'
import type { FormDataObject } from '@/components/ui/forms.types'
import type { FormProps } from '@/components/ui/forms'
import {
  Form,
  FormActions,
  FormHeading,
  InputGroup,
  TextField,
} from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import {
  useNativeFormSubmit,
  useTypedActionState,
} from '@/components/ui/forms.hooks'
import {
  DISPLAY_NAME_MAX_LENGTH,
  profileSchema,
} from '@/domain/profile/profile.schema'
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
    { initialData, initialError: initialFormError },
  )
  const nativeSubmit = useNativeFormSubmit(upsertProfileFormAction, formAction)

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
      {...nativeSubmit}
      validationErrors={state.fieldErrors}
      formError={state.error}
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
      <FormHeading id={headingId} level={headingLevel}>
        {isUpdating ? 'Update profile' : 'Create profile'}
      </FormHeading>
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
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          pattern=".*\S.*"
          isDisabled={isDisabled}
          defaultValue={state.formData?.displayName}
          label="Display Name (shown publicly)"
        />
      </InputGroup>
    </Form>
  )
}
