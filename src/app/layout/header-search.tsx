import { css } from 'styled-system/css'
import { SearchBar } from '@/features/search/components/search-bar'

export function HeaderSearch() {
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
        initialQuery=""
        scope={{ scope: 'all' }}
        css={{ maxWidth: 'none' }}
      />
    </div>
  )
}
