import type { AlbumKey } from '@/domain/album/album.schema'

interface FeaturedAlbum {
  albumKey: AlbumKey
  // editorial display title; the raw album name stays in the key
  title: string
}

// album ids are case-sensitive; verify new keys against the live API
export const FEATURED_ALBUMS: Array<FeaturedAlbum> = [
  {
    albumKey: { providerId: 'nasa_ivl', externalId: 'Apollo-at-50' },
    title: 'Apollo, at fifty',
  },
  {
    albumKey: { providerId: 'nasa_ivl', externalId: 'Artemis_I_Launch' },
    title: 'Artemis I, from the pad',
  },
]

export const SUGGESTED_SEARCHES: Array<string> = [
  'crab nebula',
  'apollo 11',
  'earthrise',
  'jupiter',
  'spacewalk',
  'saturn',
]
