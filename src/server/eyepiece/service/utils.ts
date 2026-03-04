import type { EyepiecePagination } from '@/lib/eyepiece-api-client/types'

export function calculateNextPage(
  pagination: EyepiecePagination,
  currentPageItemCount: number,
  totalItemCount: number,
): number | undefined {
  return totalItemCount >
    (pagination.page - 1) * pagination.pageSize + currentPageItemCount
    ? pagination.page + 1
    : undefined
}

export function paginationToRange(pagination: EyepiecePagination) {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize - 1
  return { start, end }
}
