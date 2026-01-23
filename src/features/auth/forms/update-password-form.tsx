import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { useUserQuery } from '../auth-queries'
import { updatePassword } from '../auth-service'
import { SetPasswordField } from './components/set-password-field'
import { setPasswordFieldSchema } from './components/set-password-field.schema'
import { AuthFormHeading } from './components/auth-form-heading'
import type { HeadingLevel } from './components/auth-form-heading'
import { Form, InputGroup } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useActionForm, useDerivedFormState } from '@/components/ui/forms.hooks'

const updatePasswordSchema = z.object({
  password: setPasswordFieldSchema,
})

export function UpdatePasswordForm({
  headingLevel,
  onSuccess,
}: {
  headingLevel: HeadingLevel
  onSuccess: () => void
}) {
  const id = useId()
  const userQuery = useUserQuery()
  const [state, formAction, isPending] = useActionForm(
    updatePasswordSchema,
    updatePassword,
  )
  useEffect(() => {
    if (state.status === 'success') {
      onSuccess()
    }
  }, [state, onSuccess])

  const { fieldErrors, formErrors, values } = useDerivedFormState(state)

  return (
    <Form
      aria-labelledby={id}
      autoComplete="on"
      action={formAction}
      validationErrors={fieldErrors}
      formErrors={formErrors}
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
      <AuthFormHeading id={id} headingLevel={headingLevel}>
        Update Password
      </AuthFormHeading>
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
        <SetPasswordField defaultValue={values.password} />
      </InputGroup>
    </Form>
  )
}
