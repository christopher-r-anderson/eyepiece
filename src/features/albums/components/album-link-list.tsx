import { css } from 'styled-system/css'
import type { AlbumKey } from '@/domain/album/album.schema'
import { Link } from '@/components/ui/link'
import { toAlbumKeyString } from '@/domain/album/album.utils'

export function AlbumLinkList({ albums }: { albums: Array<AlbumKey> }) {
  return (
    <ul
      className={css({
        listStyleType: 'none',
        padding: 0,
      })}
    >
      {albums.map((album) => (
        <li key={toAlbumKeyString(album)}>
          <Link
            to="/albums/$providerId/$albumId"
            params={{ providerId: album.providerId, albumId: album.externalId }}
            underline
            css={{ color: 'text.muted' }}
          >
            {album.externalId}
          </Link>
        </li>
      ))}
    </ul>
  )
}
