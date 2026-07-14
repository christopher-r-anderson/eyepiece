import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/features/auth/forms/login-form'
import { AuthPageSessionCheck } from '@/features/auth/components/auth-page-session-check'
import {
  AuthAltAction,
  authAltActionLinkCss,
} from '@/features/auth/components/auth-alt-action'
import { useRedirectAuthenticatedUser } from '@/features/auth/hooks/use-redirect-authenticated-user'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/(public)/(auth)/login')({
  component: LoginPage,
})

function LoginPage() {
  const { next } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { shouldShowAuthForm } = useRedirectAuthenticatedUser(next)

  if (!shouldShowAuthForm) {
    return <AuthPageSessionCheck heading="Log In" />
  }

  return (
    <>
      <LoginForm
        headingLevel={1}
        surface="panel"
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
        <Link to="/register" css={authAltActionLinkCss}>
          Register
        </Link>
      </AuthAltAction>
    </>
  )
}
