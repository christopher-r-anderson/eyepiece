import { createFileRoute } from '@tanstack/react-router'
import { AnyProviderSearchBar } from '@/features/search/components/search-bar'

export const Route = createFileRoute('/(pages)/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <h1>Search Public Space Image Libraries</h1>
      <AnyProviderSearchBar css={{ width: '100%', maxWidth: '720px' }} />
    </>
  )
}
