import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
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
      <h1
        className={css({
          fontSize: 'clamp(token(fontSizes.2xl), 5vw, 3rem)',
          lineHeight: 'tight',
          marginTop: '4',
          marginInline: 0,
          marginBottom: '6',
        })}
      >
        Search Public Space Image Libraries
      </h1>
      <SearchBar
        css={css.raw({ width: '100%' })}
        initialQuery=""
        scope={{ scope: 'all' }}
      />
    </section>
  )
}
