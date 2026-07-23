export const CollectionsErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type CollectionsErrorCode =
  (typeof CollectionsErrorCodes)[keyof typeof CollectionsErrorCodes]
