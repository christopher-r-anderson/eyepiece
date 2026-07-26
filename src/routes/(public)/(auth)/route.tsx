import { createFileRoute } from '@tanstack/react-router'
import { authPageSearchParamsSchema } from '@/features/auth/auth.schema'
import { AuthPageLayout } from '@/components/auth-page-layout'

export const Route = createFileRoute('/(public)/(auth)')({
  validateSearch: authPageSearchParamsSchema,
  component: AuthPageLayout,
  staticData: { authInteractionStrategy: 'page' },
})
