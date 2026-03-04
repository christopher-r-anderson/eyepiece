import type { AlbumKey } from '@/domain/album/album.schema'
import { Link } from '@/components/ui/link'
import { toAlbumKeyString } from '@/domain/album/album.utils'

const albumListCss = {
  listStyleType: 'none',
  margin: 0,
  padding: 0,
}

const albumLinkCss = {
  color: 'gray',
  textDecoration: 'underline',
}

export function AlbumLinkList({ albums }: { albums: Array<AlbumKey> }) {
  return (
    <ul css={albumListCss}>
      {albums.map((album) => (
        <li key={toAlbumKeyString(album)}>
          <Link
            to="/albums/$albumId"
            params={{ albumId: album.externalId }}
            css={albumLinkCss}
          >
            {album.externalId}
          </Link>
        </li>
      ))}
    </ul>
  )
}
