import {
  useLocation,
  useNavigate,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import type { AuthModalState } from '@/features/auth/auth.schema'
import { stripAuthSearchParams } from '@/features/auth/auth.utils'
import { LoginForm } from '@/features/auth/forms/login-form'
import {
  RegistrationForm,
  RegistrationSuccessMessage,
} from '@/features/auth/forms/registration-form'
import {
  ForgotPasswordForm,
  ForgotPasswordSuccessMessage,
} from '@/features/auth/forms/forgot-password-form'
import { useShowAuthModal } from '@/features/auth/hooks/use-show-auth-modal'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@/components/ui/tabs'
import { ModalDialog } from '@/components/ui/modal-dialog'
import { Link } from '@/components/ui/link'
import {
  StableVisibilityStack,
  StableVisibilityStackItem,
} from '@/components/ui/stable-visibility-stack'
import { FormStatusSwitcher } from '@/components/ui/forms'
import { urlToNextParam } from '@/lib/utils'

function showForgotPasswordSearch<T extends Record<string, unknown>>(prev: T) {
  return {
    ...stripAuthSearchParams(prev),
    auth: 'login' as const,
    fp: 1 as const,
  }
}

export function AuthModalController({
  modal: { authMode, showForgotPassword },
}: {
  modal: AuthModalState
}) {
  const href = useLocation({ select: (location) => location.href })
  const next = urlToNextParam(href)
  const navigate = useNavigate()
  const router = useRouter()
  const showAuthModal = useShowAuthModal()
  const openedByPush = useRouterState({
    select: (s) => !!s.location.state.dialogPushed,
  })
  // closing never pushes forward: consume the entry the open pushed, or
  // replace in place when the modal params arrived by deep link
  const close = useCallback(() => {
    if (openedByPush) {
      router.history.back()
      return
    }
    navigate({
      to: '.',
      search: stripAuthSearchParams,
      replace: true,
      viewTransition: false,
    })
  }, [openedByPush, router, navigate])

  return (
    <ModalDialog
      title="Log In or Register"
      isOpen={!!authMode}
      onOpenChange={close}
    >
      <Tabs
        selectedKey={authMode ?? 'login'}
        aria-label="Authentication options"
        css={css.raw({ maxWidth: 'formMax' })}
      >
        <TabList>
          <Tab id="login" onClick={() => showAuthModal('login')}>
            Log In
          </Tab>
          <Tab id="register" onClick={() => showAuthModal('register')}>
            Register
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="login">
            <StableVisibilityStack
              activeKey={showForgotPassword ? 'forgotPassword' : 'login'}
            >
              <StableVisibilityStackItem itemKey="forgotPassword">
                <ForgotPasswordSection next={next} />
              </StableVisibilityStackItem>
              <StableVisibilityStackItem itemKey="login">
                <LoginSection next={next} onSuccess={close} />
              </StableVisibilityStackItem>
            </StableVisibilityStack>
          </TabPanel>
          <TabPanel id="register">
            <RegistrationSection next={next} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </ModalDialog>
  )
}

function LoginSection({
  next,
  onSuccess,
}: {
  next: string
  onSuccess: () => void
}) {
  return (
    <div className={grid({ gap: '4' })}>
      <LoginForm
        headingLevel={3}
        onSuccess={onSuccess}
        forgotPasswordLink={
          // in-dialog navigation replaces so the open dialog stays a
          // single history entry
          <Link
            to="."
            search={showForgotPasswordSearch}
            replace
            state={(prev) => prev}
            viewTransition={false}
          >
            Forgot Password?
          </Link>
        }
      />
      <p>
        <Link to="/login" search={{ next }} underline viewTransition={false}>
          Visit the full log in page
        </Link>
      </p>
    </div>
  )
}

function ForgotPasswordSection({ next }: { next: string }) {
  const [showPasswordResetSuccess, setShowPasswordResetSuccess] =
    useState(false)
  return (
    <FormStatusSwitcher
      showStatus={showPasswordResetSuccess}
      status={<ForgotPasswordSuccessMessage headingLevel={3} />}
    >
      <ForgotPasswordForm
        headingLevel={3}
        onSuccess={() => setShowPasswordResetSuccess(true)}
        next={next}
      />
      <p>
        <Link
          to="/auth/forgot-password"
          search={{ next }}
          underline
          viewTransition={false}
        >
          Visit the full forgot password page
        </Link>
      </p>
    </FormStatusSwitcher>
  )
}

function RegistrationSection({ next }: { next: string }) {
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false)
  return (
    <FormStatusSwitcher
      showStatus={showRegistrationSuccess}
      status={<RegistrationSuccessMessage headingLevel={3} />}
    >
      <RegistrationForm
        headingLevel={3}
        onSuccess={() => setShowRegistrationSuccess(true)}
        next={next}
      />
      <p>
        <Link to="/register" search={{ next }} underline viewTransition={false}>
          Visit the full register page
        </Link>
      </p>
    </FormStatusSwitcher>
  )
}
