import { createFileRoute } from '@tanstack/react-router'
import { SearchView } from '@/features/search/views/search-view'
import { nasaSearchParamsSchema } from '@/server/lib/nasa-images/types'
import { searchImagesOptions } from '@/lib/api/eyepiece/client'
import { hasSearchFields } from '@/lib/api/eyepiece/util'

export const Route = createFileRoute('/')({
  component: () => <SearchView searchParams={Route.useSearch()} />,
  validateSearch: nasaSearchParamsSchema,
  beforeLoad: () => ({
    title: 'Search NASA Images and Videos',
  }),
  loaderDeps: ({ search }) => {
    if (hasSearchFields(search)) {
      return { search }
    } else {
      return {}
    }
  },
  loader: ({ context, deps: { search } }) => {
    if (search) {
      return context.queryClient.ensureInfiniteQueryData(
        searchImagesOptions(search),
      )
    }
  },
})
