import { createFileRoute } from '@tanstack/react-router'
import { authPageSearchParamsSchema } from '@/features/auth/auth.schema'
import { AuthPageLayout } from '@/routes/-components/auth-page-layout'

export const Route = createFileRoute('/(private)/(auth)')({
  validateSearch: authPageSearchParamsSchema,
  component: AuthPageLayout,
  staticData: { authInteractionStrategy: 'page' },
})
