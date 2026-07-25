import { VisuallyHidden } from 'styled-system/jsx'
import { UserMenu } from './user-menu'
import { LoginLink } from './login-link'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import {
  StableVisibilityStack,
  StableVisibilityStackItem,
} from '@/components/ui/stable-visibility-stack'

export function UserStatus() {
  const { data: user, isPending } = useCurrentUserQuery()
  // optimistic logged-out: the link renders from SSR onward and swaps only
  // when a session actually resolves, so nobody sees an empty slot
  const authStatus = user ? 'logged-in' : 'logged-out'
  return (
    <>
      <VisuallyHidden aria-live="polite" aria-atomic="true">
        {!isPending && authStatus === 'logged-in' ? 'User menu loaded.' : ''}
        {!isPending && authStatus === 'logged-out'
          ? 'Please log in to see the menu.'
          : ''}
      </VisuallyHidden>
      <StableVisibilityStack activeKey={authStatus}>
        <StableVisibilityStackItem
          itemKey="logged-out"
          justify="end"
          align="center"
        >
          <LoginLink />
        </StableVisibilityStackItem>
        <StableVisibilityStackItem
          itemKey="logged-in"
          justify="end"
          align="center"
        >
          <UserMenu />
        </StableVisibilityStackItem>
      </StableVisibilityStack>
    </>
  )
}
