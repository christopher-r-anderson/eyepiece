export const ASSET_PREVIEW_SNAPSHOT_STALE_TIME = 7 * 24 * 60 * 60 * 1000

export const EnsureAssetPreviewSnapshotErrorCodes = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type EnsureAssetPreviewSnapshotErrorCode =
  (typeof EnsureAssetPreviewSnapshotErrorCodes)[keyof typeof EnsureAssetPreviewSnapshotErrorCodes]
