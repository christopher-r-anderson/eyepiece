import { UserCircleIcon } from '@phosphor-icons/react/dist/ssr'
import { useRouter } from '@tanstack/react-router'
import { Menu, MenuItem, MenuTrigger, Popover } from '@/components/ui/menus'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const router = useRouter()
  return (
    <MenuTrigger>
      <Button aria-label="User Menu">
        <UserCircleIcon size={24} />
      </Button>
      <Popover>
        <Menu>
          <MenuItem
            href={{
              to: '/settings/profile',
            }}
          >
            Profile
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
