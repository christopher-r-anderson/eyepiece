import { createFileRoute } from '@tanstack/react-router'
import { privateAnonymousBoundary } from '@/lib/route-boundaries'

// These routes carry sensitive one-time tokens and must never be publicly cached.
export const Route = createFileRoute('/(token-callbacks)')({
  ...privateAnonymousBoundary,
})
