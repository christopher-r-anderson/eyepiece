export const ToggleFavoriteErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ToggleFavoriteErrorCode =
  (typeof ToggleFavoriteErrorCodes)[keyof typeof ToggleFavoriteErrorCodes]
