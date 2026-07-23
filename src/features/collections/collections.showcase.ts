import type { CollectionVisibility } from './collections.schema'
import type { AssetKey } from '@/domain/asset/asset.schema'

export interface ShowcaseCollection {
  id: string
  name: string
  visibility: CollectionVisibility
  items: Array<AssetKey>
}

export interface ShowcaseCuration {
  user: {
    id: string
    email: string
    displayName: string
  }
  collections: Array<ShowcaseCollection>
}

// The curated-content source of truth: the provisioning reconcile makes every
// environment's database match this file, so showcase content changes by
// editing it and deploying. Ids are fixed here so local, CI, and production
// agree on every URL the homepage links.
//
// The account is created with a discarded random password; access is minted
// on demand with project-admin rights.
export const SHOWCASE_CURATION: ShowcaseCuration = {
  user: {
    id: 'c081d76d-0949-4dd0-8041-475fad3f8d7c',
    email: 'christopher.r.anderson+eyepiece-showcase@gmail.com',
    displayName: 'eyepiece',
  },
  collections: [
    {
      id: 'eef5ca48-ba1f-44f0-85e8-5c8d0d6755dd',
      name: 'the apollo era',
      visibility: 'public',
      items: [
        { providerId: 'nasa_ivl', externalId: '6900556' },
        { providerId: 'nasa_ivl', externalId: 'as08-14-2383' },
        { providerId: 'nasa_ivl', externalId: 'as11-40-5903' },
        { providerId: 'nasa_ivl', externalId: 'as11-44-6552' },
        { providerId: 'nasa_ivl', externalId: 'as12-49-7278' },
        { providerId: 'nasa_ivl', externalId: 'as15-88-11866' },
        { providerId: 'nasa_ivl', externalId: 'as16-113-18339' },
        { providerId: 'nasa_ivl', externalId: 'as17-134-20384' },
      ],
    },
    {
      id: 'c1e82ce4-0efc-40f7-bfc7-e1fd62e6343d',
      name: 'earth from orbit',
      visibility: 'public',
      items: [
        { providerId: 'nasa_ivl', externalId: 's130e009953' },
        { providerId: 'nasa_ivl', externalId: 'iss028e028791' },
        { providerId: 'nasa_ivl', externalId: 'iss058e005282' },
        { providerId: 'nasa_ivl', externalId: 'iss072e159172' },
        { providerId: 'nasa_ivl', externalId: 'iss071e570863' },
        { providerId: 'nasa_ivl', externalId: 'iss073e0685684' },
        { providerId: 'nasa_ivl', externalId: 's36-39-014' },
      ],
    },
    {
      id: '21c33a8c-f642-410a-9188-11054399140f',
      name: 'deep sky',
      visibility: 'public',
      items: [
        { providerId: 'nasa_ivl', externalId: 'carina_nebula' },
        { providerId: 'nasa_ivl', externalId: 'southern_ring_nebula' },
        {
          providerId: 'nasa_ivl',
          externalId: 'GSFC_20171208_Archive_e000842',
        },
        {
          providerId: 'nasa_ivl',
          externalId:
            'hubble-sees-the-wings-of-a-butterfly-the-twin-jet-nebula_20283986193_o',
        },
        { providerId: 'nasa_ivl', externalId: 'PIA04200' },
        { providerId: 'nasa_ivl', externalId: 'PIA25433' },
      ],
    },
  ],
}
