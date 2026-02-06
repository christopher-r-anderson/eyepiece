import { UserCircleIcon } from '@phosphor-icons/react/dist/ssr'
import { useRouter } from '@tanstack/react-router'
import { useUserQuery } from '../auth-queries'
import { Menu, MenuItem, MenuTrigger, Popover } from '@/components/ui/menus'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const router = useRouter()
  const { data: user } = useUserQuery()
  return (
    <MenuTrigger>
      <Button aria-label="User Menu">
        <UserCircleIcon size={24} />
      </Button>
      <Popover>
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
              to: '/settings/profile',
            }}
          >
            Edit Profile
          </MenuItem>
          <MenuItem
            onAction={async () => {
              await createSupabaseBrowserClient().auth.signOut({
                scope: 'local',
              })
              router.invalidate()
            }}
          >
            Log Out
          </MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}
