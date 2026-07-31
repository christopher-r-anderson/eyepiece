import type { Pagination } from './pagination.schema'

// The next page exists when this page's window ends before the reported
// total; counting delivered items instead would let a short upstream page
// extend the walk past the end of the results.
export function calculateNextPage(
  { page, pageSize }: Pagination,
  totalItemCount: number,
): number | null {
  return page * pageSize < totalItemCount ? page + 1 : null
}

// an offset walk's cursor is its page number in string form
export function pageNumberCursor(page: number | null): string | null {
  return page === null ? null : String(page)
}
