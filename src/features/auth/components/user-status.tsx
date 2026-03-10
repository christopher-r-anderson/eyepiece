import { useEffect, useState } from 'react'
import { VisuallyHidden } from 'react-aria'
import { UserMenu } from './user-menu'
import { LoginLink } from './login-link'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import {
  StableVisibilityStack,
  StableVisibilityStackItem,
} from '@/components/ui/stable-visibility-stack'

type status = 'loading' | 'logged-in' | 'logged-out'

export function UserStatus() {
  const { data: user, isPending } = useCurrentUserQuery()
  const [authStatus, setAuthStatus] = useState<status>('loading')
  useEffect(() => {
    if (isPending) {
      setAuthStatus('loading')
    } else if (user) {
      setAuthStatus('logged-in')
    } else {
      setAuthStatus('logged-out')
    }
  }, [isPending, user])
  return (
    <>
      <VisuallyHidden aria-live="polite" aria-atomic="true">
        {authStatus === 'logged-in' ? 'User menu loaded.' : ''}
        {authStatus === 'logged-out' ? 'Please log in to see the menu.' : ''}
      </VisuallyHidden>
      <StableVisibilityStack activeKey={authStatus}>
        <StableVisibilityStackItem itemKey="logged-out" align="center">
          <LoginLink />
        </StableVisibilityStackItem>
        <StableVisibilityStackItem itemKey="logged-in">
          <UserMenu />
        </StableVisibilityStackItem>
      </StableVisibilityStack>
    </>
  )
}
