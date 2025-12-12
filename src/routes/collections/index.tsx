import { createFileRoute } from '@tanstack/react-router'
import { CollectionsPage } from '@/features/collections/components/collections-page'

export const Route = createFileRoute('/collections/')({
  component: CollectionsPage,
  beforeLoad: () => ({
    title: 'Collections of NASA Images and Videos',
  }),
})
