import { UserCircleIcon } from '@phosphor-icons/react/dist/ssr'
import { useRouter } from '@tanstack/react-router'
import { useCurrentUserQuery } from '../auth.queries'
import { useAuthCommands } from '../hooks/use-auth-commands'
import { Menu, MenuItem, MenuTrigger } from '@/components/ui/menus'
import { Button } from '@/components/ui/button'
import { Popover } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { logErrorWithObservability } from '@/lib/error-logging'
import { resultIsError } from '@/lib/result'

export function UserMenu() {
  const { commands } = useAuthCommands()
  const router = useRouter()
  const queueToastMessage = useQueueToastMessage()
  const { data: user } = useCurrentUserQuery()
  const initial = user?.email?.[0]?.toUpperCase()
  return (
    <MenuTrigger>
      <Button
        aria-label="User Menu"
        variant="bare"
        css={{
          // the nav chips share the compact control square
          width: 'controlHeightSm',
          height: 'controlHeightSm',
          borderRadius: 'full',
          backgroundColor: 'bg.surface.3',
          color: 'text',
          display: 'inline-grid',
          placeItems: 'center',
          fontWeight: 600,
          fontSize: 'sm',
          transitionFast: 'background-color',
          _hovered: { backgroundColor: 'bg.surface.4' },
        }}
      >
        {initial ?? <UserCircleIcon size={20} />}
      </Button>
      <Popover placement="bottom end" containerPadding={20}>
        <Menu>
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
              to: '/favorites',
            }}
          >
            Favorites
          </MenuItem>
          <MenuItem
            href={{
              to: '/collections',
            }}
          >
            Your Collections
          </MenuItem>
          <Separator />
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
