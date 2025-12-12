import { CollectionsPage } from '@/features/collections/components/collections-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/collections/')({
  component: CollectionsPage,
})
