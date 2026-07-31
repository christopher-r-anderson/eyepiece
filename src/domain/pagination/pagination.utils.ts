import type { Pagination } from './pagination.schema'

// The next page exists when this page's offset window ends before the
// reported total. The delivered item count deliberately plays no part: a
// short page from an upstream source would otherwise extend the walk into a
// window that starts past the end of the results.
export function calculateNextPage(
  { page, pageSize }: Pagination,
  totalItemCount: number,
): number | null {
  return page * pageSize < totalItemCount ? page + 1 : null
}
