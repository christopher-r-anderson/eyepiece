import { createFileRoute } from '@tanstack/react-router'
import { publicBoundary } from '@/app/route-boundaries'

export const Route = createFileRoute('/(public)')(publicBoundary())
