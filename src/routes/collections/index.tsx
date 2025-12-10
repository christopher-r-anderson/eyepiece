import { CollectionsPage } from '@/features/collections/components/CollectionsPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/collections/')({
  component: CollectionsPage,
})
