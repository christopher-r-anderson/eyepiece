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
        width: '100%',
        maxWidth: '45rem',
        margin: '0 auto',
      })}
    >
      <Heading
        level={1}
        css={css.raw({
          fontSize: 'clamp(token(fontSizes.2xl), 5vw, 3rem)',
          marginTop: '4',
          marginInline: 0,
          marginBlockEnd: '6',
        })}
      >
        Search Public Space Image Libraries
      </Heading>
      <SearchBar
        css={css.raw({ width: '100%' })}
        initialQuery=""
        scope={{ scope: 'all' }}
      />
    </section>
  )
}
