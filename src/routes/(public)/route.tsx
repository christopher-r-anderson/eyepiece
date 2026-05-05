import { createFileRoute } from '@tanstack/react-router'
import { publicBoundary } from '@/lib/route-boundaries'

export const Route = createFileRoute('/(public)')({
  ...publicBoundary,
})
