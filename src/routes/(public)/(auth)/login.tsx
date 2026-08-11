import { createFileRoute } from '@tanstack/react-router'
import { formErrorCopy } from '@/lib/form-errors'
import { LoginForm } from '@/features/auth/forms/login-form'
import { AuthAltAction } from '@/features/auth/components/auth-alt-action'
import { useRedirectAuthenticatedUser } from '@/features/auth/hooks/use-redirect-authenticated-user'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/(public)/(auth)/login')({
  component: LoginPage,
})

function LoginPage() {
  const { next, formError } = Route.useSearch()
  const navigate = Route.useNavigate()
  useRedirectAuthenticatedUser(next)

  return (
    <>
      <LoginForm
        headingLevel={1}
        next={next}
        initialFormError={formErrorCopy(formError)}
        onSuccess={() => {
          navigate({ to: next ?? '/' })
        }}
        forgotPasswordLink={
          <Link to="/auth/forgot-password" search={{ next }}>
            Forgot Password?
          </Link>
        }
      />
      <AuthAltAction>
        Don't have an account yet?{' '}
        <Link to="/register" variant="underline">
          Register
        </Link>
      </AuthAltAction>
    </>
  )
}
