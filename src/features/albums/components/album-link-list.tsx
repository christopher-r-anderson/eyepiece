import { css, cx } from 'styled-system/css'
import { wrap } from 'styled-system/patterns'
import type { AlbumKey } from '@/domain/album/album.schema'
import { Link } from '@/components/ui/link'
import { toAlbumKeyString } from '@/domain/album/album.utils'

const listCss = css({
  listStyleType: 'none',
  padding: 0,
})

const inlineListCss = wrap({ columnGap: '3', rowGap: '1' })

export function AlbumLinkList({
  albums,
  inline,
}: {
  albums: Array<AlbumKey>
  // detail surfaces lay the links out in a row; tile chips keep the stack
  inline?: boolean
}) {
  return (
    <ul
      // Safari drops list semantics with list-style: none
      role="list"
      className={cx(listCss, inline && inlineListCss)}
    >
      {albums.map((album) => (
        <li key={toAlbumKeyString(album)}>
          <Link
            to="/albums/$providerId/$albumId"
            params={{ providerId: album.providerId, albumId: album.externalId }}
            variant="underline"
            css={{ color: 'text.muted' }}
          >
            {album.externalId}
          </Link>
        </li>
      ))}
    </ul>
  )
}
