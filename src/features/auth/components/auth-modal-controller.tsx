import {
  useLocation,
  useNavigate,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { preservedMaskOptions, stripAuthSearchParams } from '../auth.utils'
import { LoginForm } from '../forms/login-form'
import {
  RegistrationForm,
  RegistrationSuccessMessage,
} from '../forms/registration-form'
import {
  ForgotPasswordForm,
  ForgotPasswordSuccessMessage,
} from '../forms/forgot-password-form'
import { useShowAuthModal } from '../hooks/use-show-auth-modal'
import type { AuthModalState } from '../auth.schema'
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
  // full-page auth flows continue to the displayed URL, which under an
  // asset overlay is the masked detail route
  const href = useLocation({
    select: (location) => location.maskedLocation?.href ?? location.href,
  })
  const next = urlToNextParam(href)
  const navigate = useNavigate()
  const router = useRouter()
  const showAuthModal = useShowAuthModal()
  const openedByPush = useRouterState({
    select: (s) => !!s.location.state.dialogPushed,
  })
  const close = useCallback(() => {
    if (openedByPush) {
      router.history.back()
      return
    }
    navigate({
      to: '.',
      search: stripAuthSearchParams,
      replace: true,
      ...preservedMaskOptions(router.state.location),
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
  const maskedLocation = useRouterState({
    select: (s) => s.location.maskedLocation,
  })
  return (
    <div className={grid({ gap: '4' })}>
      <LoginForm
        headingLevel={3}
        next={next}
        onSuccess={onSuccess}
        forgotPasswordLink={
          <Link
            to="."
            search={showForgotPasswordSearch}
            replace
            state={(prev) => prev}
            {...preservedMaskOptions({ maskedLocation })}
          >
            Forgot Password?
          </Link>
        }
      />
      <p>
        <Link to="/login" search={{ next }} underline>
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
        <Link to="/auth/forgot-password" search={{ next }} underline>
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
        <Link to="/register" search={{ next }} underline>
          Visit the full register page
        </Link>
      </p>
    </FormStatusSwitcher>
  )
}
