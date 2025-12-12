import { createFileRoute } from '@tanstack/react-router'
import { SearchPage } from '@/features/search/components/search-page'

export const Route = createFileRoute('/')({
  component: SearchPage,
  beforeLoad: () => ({
    title: 'Search NASA Images and Videos',
  }),
})
