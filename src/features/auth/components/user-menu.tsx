import { UserCircleIcon } from '@phosphor-icons/react/dist/ssr'
import { useRouter } from '@tanstack/react-router'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { useAuthCommands } from '@/features/auth/hooks/use-auth-commands'
import { Menu, MenuItem, MenuTrigger, Popover } from '@/components/ui/menus'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { logErrorWithObservability } from '@/lib/error-logging'
import { resultIsError } from '@/lib/result'

export function UserMenu() {
  const { commands } = useAuthCommands()
  const router = useRouter()
  const queueToastMessage = useQueueToastMessage()
  const { data: user } = useCurrentUserQuery()
  return (
    <MenuTrigger>
      <Button
        aria-label="User Menu"
        css={{
          minWidth: 'calc(var(--size-control-height) - var(--space-1))',
          minHeight: 'calc(var(--size-control-height) - var(--space-1))',
          padding: 'var(--space-2)',
          border: '1px solid transparent',
          backgroundColor: 'transparent',
          color: 'var(--primary-text-muted)',
          '&[data-hovered]': {
            color: 'var(--text)',
            border:
              '1px solid color-mix(in oklab, var(--border-color) 88%, var(--text) 12%)',
            backgroundColor:
              'color-mix(in oklab, var(--tertiary-bg) 72%, var(--background) 28%)',
          },
        }}
      >
        <UserCircleIcon size={24} />
      </Button>
      <Popover placement="bottom end" containerPadding={20}>
        <Menu>
          <MenuItem
            href={{
              to: '/favorites',
            }}
          >
            Favorites
          </MenuItem>
          <Separator />
          {user && (
            <MenuItem
              href={{
                to: '/profile/$profileId',
                params: { profileId: user.id },
              }}
            >
              View Profile
            </MenuItem>
          )}
          <MenuItem
            href={{
              to: '/settings/profile',
            }}
          >
            Edit Profile
          </MenuItem>
          <MenuItem
            onAction={async () => {
              const result = await commands.logout()

              if (resultIsError(result)) {
                queueToastMessage({
                  title: 'Log out failed',
                  description: 'Please try again.',
                })
                logErrorWithObservability('Logout failed', result.error)
                return
              }

              // AuthStateSync also invalidates on the SIGNED_OUT event; this
              // direct call keeps the UI correct even if that event is missed.
              await router.invalidate()
            }}
          >
            Log Out
          </MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}
