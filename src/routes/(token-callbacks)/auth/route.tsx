import { createFileRoute } from '@tanstack/react-router'
import { privateAnonymousBoundary } from '@/lib/route-boundaries'

export const Route = createFileRoute('/(token-callbacks)/auth')({
  ...privateAnonymousBoundary,
})
