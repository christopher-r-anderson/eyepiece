import { Outlet, createFileRoute } from '@tanstack/react-router'
import { requireAuthenticated } from '@/features/auth/guards'

export const Route = createFileRoute('/(pages)/settings')({
  beforeLoad: requireAuthenticated,
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main css={{ flexGrow: '1' }}>
      <Outlet />
    </main>
  )
}
