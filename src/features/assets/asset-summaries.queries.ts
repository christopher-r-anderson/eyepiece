import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { AssetSummary, AssetSummaryId } from '@/domain/asset/asset.schema'
import type { AssetSummariesRepo } from './asset-summaries.repo'
import { unwrapOrThrow } from '@/lib/result'

type AssetSummariesByIdKey = ['assets', 'summaries', 'byId', string]

function assetSummariesByIdKey(
  assetSummaryId: AssetSummaryId,
): AssetSummariesByIdKey {
  return ['assets', 'summaries', 'byId', assetSummaryId] as const
}

type AssetSummariesBatchKey = ['assets', 'summaries', 'batch', string]

function assetSummariesBatchKey(
  assetSummaryIds: Array<AssetSummaryId>,
): AssetSummariesBatchKey {
  const key = Array.from(new Set(assetSummaryIds.toSorted())).join('|')
  return ['assets', 'summaries', 'batch', key] as const
}

export function getAssetSummariesBatchOptions({
  assetSummaryIds,
  repo,
}: {
  assetSummaryIds: Array<AssetSummaryId>
  repo: Pick<AssetSummariesRepo, 'getAssetSummaries'>
}) {
  return queryOptions({
    queryKey: assetSummariesBatchKey(assetSummaryIds),
    placeholderData: keepPreviousData,
    queryFn: async ({ client }) => {
      const toFetch = assetSummaryIds.filter(
        (id) => !client.getQueryData<AssetSummary>(assetSummariesByIdKey(id)),
      )
      if (toFetch.length > 0) {
        const result = await repo.getAssetSummaries(toFetch)
        const newSummaries = unwrapOrThrow(result)
        for (const summary of newSummaries) {
          client.setQueryData<AssetSummary>(
            assetSummariesByIdKey(summary.id),
            summary,
          )
        }
      }
      return assetSummaryIds.map((id) => {
        const summary = client.getQueryData<AssetSummary>(
          assetSummariesByIdKey(id),
        )
        if (!summary) {
          throw new Error(`Asset summary not found for id: ${id}`)
        }
        return summary
      })
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export const useAssetSummariesBatch = ({
  assetSummaryIds = [],
  repo,
}: {
  assetSummaryIds?: Array<AssetSummaryId>
  repo: Pick<AssetSummariesRepo, 'getAssetSummaries'>
}) => {
  return useQuery(getAssetSummariesBatchOptions({ assetSummaryIds, repo }))
}
