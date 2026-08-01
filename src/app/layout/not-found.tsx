import { useRouterState } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { Link } from '@/components/ui/link'
import { pageMainCss } from '@/components/page-main'
import { toSearchPageParams } from '@/features/search/search-page-params'

// layout routes that already wrap their outlet in the page <main>; a fuzzy
// not-found match renders inside them, while a fully unmatched URL renders
// at the root with no landmark at all
const MAIN_LAYOUT_ROUTE_IDS = new Set([
  '/(public)/(pages)',
  '/(private)/(pages)',
  '/(public)/(auth)',
  '/(private)/(auth)',
])

export function NotFoundPage() {
  const hasLayoutMain = useRouterState({
    select: (state) =>
      state.matches.some((match) => MAIN_LAYOUT_ROUTE_IDS.has(match.routeId)),
  })
  const body = (
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
        <Link
          to="/search"
          search={toSearchPageParams('', { scope: 'all' })}
          variant="underline"
        >
          search the collections
        </Link>
        .
      </p>
    </div>
  )
  if (hasLayoutMain) {
    return body
  }
  return <main className={css(pageMainCss)}>{body}</main>
}
