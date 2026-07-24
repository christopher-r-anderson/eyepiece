import { useLocation } from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { css } from 'styled-system/css'
import type { SearchPageState } from '@/features/search/search-page-params'
import {
  SEARCH_FORM_ID,
  SearchBar,
} from '@/features/search/components/search-bar'
import {
  searchPageParamsSchema,
  toSearchPageState,
} from '@/features/search/search-page-params'

const EMPTY_STATE: SearchPageState = { q: '', scope: { scope: 'all' } }

export function HeaderSearch() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const search = useLocation({ select: (location) => location.search })
  // on the search page the header field is the search UI: prefilled with
  // the live query and carrying the scope's hidden fields
  const { q, scope } =
    pathname === '/search'
      ? toSearchPageState(searchPageParamsSchema.parse(search))
      : EMPTY_STATE
  return (
    <div
      className={css({
        flex: '1 1 auto',
        minWidth: 0,
        maxWidth: '460px',
        // the field's validation message must not grow the sticky header
        position: 'relative',
        '& [slot=errorMessage]': {
          position: 'absolute',
          insetInlineStart: 0,
          top: '100%',
          backgroundColor: 'bg.surface.1',
          paddingInline: '2',
          paddingBlock: '1',
          borderRadius: 'sm',
          zIndex: 'sticky',
        },
      })}
    >
      <SearchBar
        // keyed by q alone: the bar owns the draft query, so a scope or
        // filter navigation must not remount it and wipe an unsent draft
        key={hashKey(['site-search', q])}
        id={SEARCH_FORM_ID}
        initialQuery={q}
        scope={scope}
        css={{ maxWidth: 'none' }}
      />
    </div>
  )
}
