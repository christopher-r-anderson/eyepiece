import { createFileRoute } from '@tanstack/react-router'
import { authenticatedBoundary } from '@/lib/route-boundaries'

export const Route = createFileRoute('/(private)')({
  ...authenticatedBoundary,
})
