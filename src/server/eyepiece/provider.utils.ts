import sanitizeHtml from 'sanitize-html'
import type { AssetImage, Rendition } from '@/domain/asset/asset.schema'
import type { Pagination } from '@/domain/pagination/pagination.schema'

// browsers do not decode TIFF, and NASA serves one as the original on about a
// tenth of its records
const UNDECODABLE_PATTERN = /\.tiff?($|\?)/i

export function isDecodableImageHref(href: string) {
  return !UNDECODABLE_PATTERN.test(href)
}

// A srcset splits candidates on whitespace, so a rendition href carrying a
// raw space is unparseable and the browser silently drops back to the plain
// src. NASA ids routinely contain spaces. Commas are left alone: they only
// separate when they end a url, and the delivery service's size syntax needs
// the one it puts mid-path.
function toSrcSetSafeHref(href: string) {
  try {
    return new URL(href).toString()
  } catch {
    return href
  }
}

export function toAssetImage(
  candidates: Array<Rendition | undefined>,
  master?: { width?: number; height?: number },
): AssetImage | undefined {
  // a srcset picks by width, so two renditions at one width are the same
  // candidate twice; the earlier one wins because callers order by intent
  const byWidth = new Map<number, Rendition>()
  for (const candidate of candidates) {
    if (candidate && !byWidth.has(candidate.width)) {
      byWidth.set(candidate.width, {
        ...candidate,
        href: toSrcSetSafeHref(candidate.href),
      })
    }
  }
  const renditions = [...byWidth.values()].sort((a, b) => b.width - a.width)
  if (renditions.length === 0) return undefined
  const [widest, ...rest] = renditions
  return {
    width: master?.width ?? widest.width,
    height: master?.height ?? widest.height,
    renditions: [widest, ...rest],
  }
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

// both providers reuse the title as descriptive text often enough that the
// duplicate would otherwise be read out twice on the detail page
export function dropTitleDuplicate(
  value: string | undefined,
  title: string,
): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  const normalize = (text: string) => text.replace(/\s+/g, ' ').toLowerCase()
  return normalize(trimmed) === normalize(title.trim()) ? undefined : trimmed
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
