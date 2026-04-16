import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import type { HeadingLevel } from '@/components/ui/heading'
import { useEmailRedirectTo } from '@/features/auth/hooks/use-email-redirect-to'
import { useAuth } from '@/features/auth/auth.provider'
import { Heading } from '@/components/ui/heading'
import {
  Form,
  InputGroup,
  TextField,
  formActionButtonCss,
  formActionsCss,
  formStatusPanelCss,
} from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { useEvent } from '@/lib/hooks/use-event'

const forgotPasswordSchema = z.object({
  email: z.email(),
  redirectTo: z.url(),
})

export function ForgotPasswordForm({
  headingLevel,
  next,
  onSuccess,
  surface,
}: {
  headingLevel: HeadingLevel
  next?: string
  onSuccess: () => void
  surface?: 'plain' | 'panel'
}) {
  const id = useId()
  const redirectTo = useEmailRedirectTo(next)
  const { commands } = useAuth()

  const [state, formAction, isPending] = useTypedActionState(
    forgotPasswordSchema,
    commands.resetPassword,
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
      aria-busy={isPending || undefined}
      autoComplete="on"
      action={formAction}
      validationErrors={state.fieldErrors}
      formError={state.error}
      surface={surface}
      controls={
        <div css={formActionsCss}>
          <Button
            variant="primary"
            type="submit"
            isDisabled={isPending}
            css={formActionButtonCss}
          >
            Reset Password
          </Button>
        </div>
      }
    >
      <Heading id={id} headingLevel={headingLevel}>
        Reset Password
      </Heading>
      <InputGroup>
        <input type="hidden" name="redirectTo" defaultValue={redirectTo} />
        <TextField
          name="email"
          type="email"
          autoComplete="email"
          isRequired
          defaultValue={state.formData?.email}
          label="Email"
          placeholder="name@example.com"
        />
      </InputGroup>
    </Form>
  )
}

export function ForgotPasswordSuccessMessage({
  headingLevel,
}: {
  headingLevel: HeadingLevel
}) {
  return (
    <div css={formStatusPanelCss}>
      <Heading headingLevel={headingLevel}>Password reset sent!</Heading>
      <p>Please check your email to reset your password.</p>
    </div>
  )
}
