import { createFileRoute } from '@tanstack/react-router'
import { requireAuthenticated } from '@/lib/guards'

export const Route = createFileRoute('/(pages)/(user)')({
  beforeLoad: requireAuthenticated,
})
