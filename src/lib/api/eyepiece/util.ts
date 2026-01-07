import type { EyepiecePageSearchParams } from './types'

export function hasSearchFields(params: EyepiecePageSearchParams): boolean {
  return Boolean(params.q)
}
