import { EyepiecePagination } from '@/lib/api/eyepiece/types'

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
