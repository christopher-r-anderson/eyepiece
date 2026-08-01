import { css } from 'styled-system/css'
import { Link } from '@/components/ui/link'
import { NotFound } from '@/components/errors/not-found'
import { pageMainCss } from '@/components/page-main'
import { toSearchPageParams } from '@/features/search/search-page-params'

// the root-mode 404 renders outside every route group, so this wrapper
// owns the page <main>; the content lives in components/errors
export function NotFoundPage() {
  return (
    <main className={css(pageMainCss)}>
      <NotFound
        title="Page not found"
        meta="404"
        message={
          <>
            This address doesn't match anything here. Head{' '}
            <Link to="/" variant="underline">
              home
            </Link>{' '}
            or{' '}
            <Link
              to="/search"
              search={toSearchPageParams('', { scope: 'all' })}
              variant="underline"
            >
              search the collections
            </Link>
            .
          </>
        }
      />
    </main>
  )
}
