import { createFileRoute } from '@tanstack/react-router'
import { AnyProviderSearchBar } from '@/features/search/components/search-bar'

export const Route = createFileRoute('/(pages)/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section
      css={{
        width: '100%',
        maxWidth: '45rem',
        margin: '0 auto',
      }}
    >
      <h1
        css={{
          fontSize: 'clamp(var(--text-2xl), 5vw, 3rem)',
          lineHeight: 'var(--line-height-tight)',
          margin: 'var(--space-4) 0 var(--space-6)',
        }}
      >
        Search Public Space Image Libraries
      </h1>
      <AnyProviderSearchBar css={{ width: '100%' }} />
    </section>
  )
}
