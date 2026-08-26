import { css } from 'styled-system/css'
import { Link } from '@/components/ui/link'
import { NotFound } from '@/components/errors/not-found'
import { MAIN_CONTENT_ID, pageMainCss } from '@/components/page-main'
import { toSearchPageParams } from '@/features/search/search-page-params'

export function NotFoundPage() {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className={css(pageMainCss)}>
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
