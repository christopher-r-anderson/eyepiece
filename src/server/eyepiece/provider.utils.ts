import sanitizeHtml from 'sanitize-html'
import type { Pagination } from '@/domain/pagination/pagination.schema'

export const NOT_FOUND_IMAGE = {
  // A 1x1 transparent GIF
  href: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  width: 640,
  height: 480,
}

export function calculateNextPage(
  pagination: Pagination,
  currentPageItemCount: number,
  totalItemCount: number,
): number | null {
  return totalItemCount >
    (pagination.page - 1) * pagination.pageSize + currentPageItemCount
    ? pagination.page + 1
    : null
}

export function paginationToRange(pagination: Pagination) {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize - 1
  return { start, end }
}

export function htmlToPlainText(input: string): string {
  const normalized = input
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n')
    .replace(/<\/\s*div\s*>/gi, '\n')
  const text = sanitizeHtml(normalized, {
    allowedTags: [],
    allowedAttributes: {},
  })
  return text.replace(/\n{3,}/g, '\n\n').trim()
}
