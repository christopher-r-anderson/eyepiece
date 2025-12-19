import { EyepieceSearchParams } from './types'

export function hasSearchFields(params: EyepieceSearchParams): boolean {
  return Boolean(params.q)
}
