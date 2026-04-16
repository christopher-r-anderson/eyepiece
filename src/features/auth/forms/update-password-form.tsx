import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { setPasswordFieldSchema } from './components/set-password-field.schema'
import type { HeadingLevel } from '@/components/ui/heading'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { useAuth } from '@/features/auth/auth.provider'
import { SetPasswordField } from '@/features/auth/forms/components/set-password-field'
import { Form, InputGroup } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { useEvent } from '@/lib/hooks/use-event'
import { Heading } from '@/components/ui/heading'

const updatePasswordSchema = z.object({
  password: setPasswordFieldSchema,
})

export function UpdatePasswordForm({
  headingLevel,
  onSuccess,
  surface,
}: {
  headingLevel: HeadingLevel
  onSuccess: () => void
  surface?: 'plain' | 'panel'
}) {
  const id = useId()
  const userQuery = useCurrentUserQuery()
  const { commands } = useAuth()

  const [state, formAction, isPending] = useTypedActionState(
    updatePasswordSchema,
    commands.updatePassword,
  )

  const onSuccessRef = useEvent(onSuccess)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccessRef.current?.()
    }
  }, [state.status])

  return (
    <Form
      aria-labelledby={id}
      autoComplete="on"
      action={formAction}
      validationErrors={state.fieldErrors}
      formError={state.error}
      surface={surface}
      aria-busy={isPending || undefined}
      controls={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBlockStart: '1rem',
          }}
        >
          <Button variant="primary" type="submit" isDisabled={isPending}>
            Update
          </Button>
        </div>
      }
    >
      <Heading id={id} headingLevel={headingLevel}>
        Update Password
      </Heading>
      <InputGroup>
        {/* for the browser save password prompt */}
        <input
          type="email"
          name="username"
          value={userQuery.data?.email ?? ''}
          autoComplete="username"
          css={{ display: 'none' }}
          readOnly
        />
        <SetPasswordField defaultValue={state.formData?.password} />
      </InputGroup>
    </Form>
  )
}
