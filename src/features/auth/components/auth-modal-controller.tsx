import { useLocation, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { stripAuthSearchParams, urlToNextParam } from '../util'
import { LoginForm } from '../forms/login-form'
import {
  RegistrationForm,
  RegistrationSuccessMessage,
} from '../forms/registration-form'
import {
  ForgotPasswordForm,
  ForgotPasswordSuccessMessage,
} from '../forms/forgot-password-form'
import type { AuthModalState } from '../schemas'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@/components/ui/tabs'
import { ModalDialog } from '@/components/ui/modal-dialog'
import { Link } from '@/components/ui/link'
import {
  StableVisibilityStack,
  StableVisibilityStackItem,
} from '@/components/ui/stable-visibility-stack'
import { FormStatusSwitcher } from '@/components/ui/forms'

export function AuthModalController({
  modal: { authMode, showForgotPassword },
}: {
  modal: AuthModalState
}) {
  const href = useLocation({ select: (location) => location.href })
  const next = urlToNextParam(href)
  const navigate = useNavigate()
  const goBack = useCallback(() => {
    navigate({
      to: '.',
      search: stripAuthSearchParams,
      viewTransition: false,
    })
  }, [navigate])

  return (
    <ModalDialog
      title="Log In or Register"
      isOpen={!!authMode}
      onOpenChange={goBack}
    >
      <Tabs
        selectedKey={authMode ?? 'login'}
        aria-label="Authentication options"
        css={{ maxWidth: 500 }}
      >
        <TabList>
          <Tab
            id="login"
            onClick={() =>
              navigate({
                to: '.',
                search: (prev) => ({
                  ...stripAuthSearchParams(prev),
                  auth: 'login',
                }),
                viewTransition: false,
              })
            }
          >
            Log In
          </Tab>
          <Tab
            id="register"
            onClick={() =>
              navigate({
                to: '.',
                search: (prev) => ({
                  ...stripAuthSearchParams(prev),
                  auth: 'register',
                }),
                viewTransition: false,
              })
            }
          >
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
                <LoginSection next={next} onSuccess={goBack} />
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
    <>
      <LoginForm
        headingLevel={3}
        onSuccess={onSuccess}
        forgotPasswordLink={
          <Link
            to="."
            search={(prev) => ({
              ...stripAuthSearchParams(prev),
              auth: 'login',
              fp: 1,
            })}
            viewTransition={false}
          >
            Forgot Password?
          </Link>
        }
      />
      <p>
        <Link
          to="/login"
          search={{ next }}
          css={{
            color: 'var(--link-color)',
            textDecoration: 'underline',
          }}
          viewTransition={false}
        >
          Visit the full log in page
        </Link>
      </p>
    </>
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
          css={{
            color: 'var(--link-color)',
            textDecoration: 'underline',
          }}
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
        <Link
          to="/register"
          search={{ next }}
          css={{
            color: 'var(--link-color)',
            textDecoration: 'underline',
          }}
          viewTransition={false}
        >
          Visit the full register page
        </Link>
      </p>
    </FormStatusSwitcher>
  )
}
