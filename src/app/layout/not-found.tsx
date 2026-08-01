import { css } from 'styled-system/css'
import { Link } from '@/components/ui/link'
import { pageMainCss } from '@/components/page-main'

// the router-level default renders outside every route group, so it brings
// its own <main> geometry
export function NotFoundPage() {
  return (
    <main className={css(pageMainCss)}>
      <div>
        <h1 className={css({ textStyle: 'display.md' })}>Page not found</h1>
        <p
          className={css({
            marginTop: '2',
            textStyle: 'meta',
            textTransform: 'lowercase',
            color: 'text.muted',
          })}
        >
          404
        </p>
        <p
          className={css({
            marginTop: '5',
            color: 'text.muted',
            maxWidth: 'readingMax',
          })}
        >
          This address doesn't match anything here. Head{' '}
          <Link to="/" variant="underline">
            home
          </Link>{' '}
          or{' '}
          <Link to="/search" search={{ q: '' }} variant="underline">
            search the collections
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
