import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { Heading } from '@/components/ui/heading'
import { SearchBar } from '@/features/search/components/search-bar'

export const Route = createFileRoute('/(public)/(pages)/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section
      className={css({
        display: 'grid',
        gap: '6',
        width: '100%',
        maxWidth: 'pageColMax',
        marginInline: 'auto',
      })}
    >
      <Heading
        level={1}
        css={css.raw({
          fontSize: 'clamp(token(fontSizes.2xl), 5vw, 3rem)',
        })}
      >
        Search Public Space Image Libraries
      </Heading>
      <SearchBar initialQuery="" scope={{ scope: 'all' }} />
    </section>
  )
}
