import { UserCircleIcon } from '@phosphor-icons/react/dist/ssr'
import { useRouter } from '@tanstack/react-router'
import { useUserQuery } from '../auth-queries'
import { Menu, MenuItem, MenuTrigger, Popover } from '@/components/ui/menus'
import { createUserSupabaseBrowserClient } from '@/integrations/supabase/user/browser.client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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
              await createUserSupabaseBrowserClient().auth.signOut({
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
