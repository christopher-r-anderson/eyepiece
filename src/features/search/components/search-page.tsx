import { SearchBar } from './search-bar'

export function SearchPage() {
  return (
    <div
      css={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '2rem',
      }}
    >
      <h1 css={{ color: 'var(--text-accent)' }}>
        Search NASA images and videos
      </h1>
      <SearchBar fontSize="1.5rem" />
    </div>
  )
}
