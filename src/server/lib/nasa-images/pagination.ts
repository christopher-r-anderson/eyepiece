import { NASA_ALBUM_PAGE_SIZE } from './client'

export interface NasaAlbumRequestPlan {
  page: number
  sliceStart: number
  sliceEnd: number
}

// NASA Albums do not support page size, instead always returning 100 items per page
// This function will calculate which NASA album pages need to be fetched
// in order to satisfy a request for a given page and page size
// It returns an array of plans, each containing the NASA page to fetch
// and the slice of items to take from that page
export function calculateNasaAlbumRequests(
  page: number,
  pageSize: number,
  nasaPageSize: number = NASA_ALBUM_PAGE_SIZE,
): NasaAlbumRequestPlan[] {
  const startIndex = pageSize * (page - 1)
  const endIndex = startIndex + pageSize

  const startPage = Math.floor(startIndex / nasaPageSize)
  const endPage = Math.floor((endIndex - 1) / nasaPageSize)

  const plans = []
  for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
    const currentGlobalStartIndex = pageIndex * nasaPageSize
    const sliceStart = Math.max(0, startIndex - currentGlobalStartIndex)
    const sliceEnd = Math.min(nasaPageSize, endIndex - currentGlobalStartIndex)
    plans.push({ page: pageIndex + 1, sliceStart, sliceEnd })
  }
  return plans
}
