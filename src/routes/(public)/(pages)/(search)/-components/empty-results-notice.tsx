import { css } from 'styled-system/css'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { SearchQuery } from '@/domain/search/search.schema'
import { Link } from '@/components/ui/link'
import { PROVIDERS, PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'
import { defaultSearchFilters } from '@/domain/search/search.schema'
import { useSearchTotal } from '@/features/search/search.queries'

// the italic query term is the italics rule's one sanctioned use:
// a term inside prose
export function EmptyResultsNotice({
  query,
  providerId,
}: {
  query: SearchQuery
  providerId: ProviderId
}) {
  const other = PROVIDERS.find((candidate) => candidate !== providerId)
  const otherTotal = useSearchTotal(
    query,
    defaultSearchFilters(other ?? providerId),
  )
  const otherLead =
    other && otherTotal
      ? `${otherTotal} ${otherTotal === 1 ? 'result' : 'results'}`
      : undefined

  return (
    <p className={css({ color: 'text.muted', maxWidth: 'readingMax' })}>
      No matches for <em className={css({ fontStyle: 'italic' })}>{query}</em>{' '}
      in {PROVIDER_DISPLAY[providerId].displayName}. Try a broader term
      {other && otherLead ? (
        <>
          , or{' '}
          <Link to="/search" search={{ q: query, providerId: other }} underline>
            see the {otherLead} from {PROVIDER_DISPLAY[other].shortLabel}
          </Link>
        </>
      ) : null}
      .
    </p>
  )
}
