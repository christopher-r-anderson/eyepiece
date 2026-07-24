import { describe, expect, it } from 'vitest'
import {
  collectionItemPagesToAssetIds,
  collectionItemPagesToItemsView,
} from './collections.queries'
import type { CollectionItemEdge } from './collections.schema'
import type { InfiniteData } from '@tanstack/react-query'
import type { PaginatedCollection } from '@/domain/pagination/pagination.schema'

function edge(assetPreviewSnapshotId: string): CollectionItemEdge {
  return {
    createdAt: '2026-07-24T00:00:00+00:00',
    assetPreviewSnapshotId,
    assetKey: {
      providerId: 'nasa_ivl',
      externalId: `ext-${assetPreviewSnapshotId}`,
    },
  }
}

function pages(
  ...pageItems: Array<{ items: Array<CollectionItemEdge>; total: number }>
): InfiniteData<PaginatedCollection<CollectionItemEdge>, number> {
  return {
    pages: pageItems.map(({ items, total }, index) => ({
      items,
      pagination: {
        next: index < pageItems.length - 1 ? index + 2 : null,
        total,
      },
    })),
    pageParams: pageItems.map((_, index) => index + 1),
  }
}

describe('collectionItemPagesToAssetIds', () => {
  it('flattens snapshot ids across pages in order', () => {
    const data = pages(
      { items: [edge('a'), edge('b')], total: 3 },
      { items: [edge('c')], total: 3 },
    )
    expect(collectionItemPagesToAssetIds(data)).toEqual(['a', 'b', 'c'])
  })
})

describe('collectionItemPagesToItemsView', () => {
  it('exposes ids with the total from pagination', () => {
    const data = pages(
      { items: [edge('a'), edge('b')], total: 5 },
      { items: [edge('c')], total: 5 },
    )
    expect(collectionItemPagesToItemsView(data)).toEqual({
      assetPreviewSnapshotIds: ['a', 'b', 'c'],
      total: 5,
    })
  })

  it('reports zero for an empty result', () => {
    expect(collectionItemPagesToItemsView(pages())).toEqual({
      assetPreviewSnapshotIds: [],
      total: 0,
    })
  })
})
