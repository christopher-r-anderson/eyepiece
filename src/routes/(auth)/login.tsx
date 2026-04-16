import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/features/auth/forms/login-form'
import { Link } from '@/components/ui/link'
import { requireAnonymous } from '@/lib/guards'

export const Route = createFileRoute('/(auth)/login')({
  component: LoginPage,
  beforeLoad: requireAnonymous,
})

function LoginPage() {
  const { next } = Route.useSearch()
  const navigate = Route.useNavigate()

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
      <p>
        Don't have an account yet?{' '}
        <Link
          to="/register"
          css={{ textDecoration: 'underline', marginLeft: '0.5rem' }}
        >
          Register
        </Link>
      </p>
    </>
  )
}
