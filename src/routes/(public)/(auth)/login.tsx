import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { LoginForm } from '@/features/auth/forms/login-form'
import { AuthPageSessionCheck } from '@/features/auth/components/auth-page-session-check'
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
      <p
        className={css({
          marginTop: '4',
          marginInline: '0',
          marginBottom: '0',
          lineHeight: 'base',
        })}
      >
        Don't have an account yet?{' '}
        <Link
          to="/register"
          css={css.raw({ textDecoration: 'underline', marginLeft: '2' })}
        >
          Register
        </Link>
      </p>
    </>
  )
}
