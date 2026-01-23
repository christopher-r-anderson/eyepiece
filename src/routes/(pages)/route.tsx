import { Outlet, createFileRoute } from '@tanstack/react-router'
import {
  authModalSearchParamsSchema,
  authModalStateSchema,
} from '@/features/auth/schemas'
import { AuthModalController } from '@/features/auth/components/auth-modal-controller'

export const Route = createFileRoute('/(pages)')({
  validateSearch: authModalSearchParamsSchema,
  component: PagesLayout,
})

function PagesLayout() {
  const search = Route.useSearch({ select: authModalStateSchema.parse })
  return (
    <>
      <Outlet />
      <AuthModalController modal={search} />
    </>
  )
}
