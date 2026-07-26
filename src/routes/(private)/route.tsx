import { createFileRoute } from '@tanstack/react-router'
import { authenticatedBoundary } from '@/app/route-boundaries'

export const Route = createFileRoute('/(private)')(authenticatedBoundary())
