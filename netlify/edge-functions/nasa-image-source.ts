import {
  NASA_IMAGE_HREF_PREFIX,
  NASA_IMAGE_SOURCE_MAX_BYTES,
  NASA_IMAGE_SOURCE_PREFIX,
  UNDECODABLE_IMAGE_PATTERN,
  // the explicit extension is for the Deno edge bundler
} from '../../src/domain/provider/provider-image-delivery.ts'

// Same-site source for the image CDN's NASA fetches (#253). Transformed
// responses inherit the source's cache headers, and NASA's own origin serves
// max-age=300 - fetched directly, every transform would go stale in five
// minutes. The durable directive keeps the source cached across deploys.
//
// The route is publicly reachable, so it refuses what the app never emits:
// undecodable files (NASA originals are TIFF on a tenth of records, up to
// 131MB) and anything over the rendition byte cap.
export default async (request: Request) => {
  const url = new URL(request.url)
  const upstreamPath =
    url.pathname.slice(NASA_IMAGE_SOURCE_PREFIX.length) + url.search
  if (UNDECODABLE_IMAGE_PATTERN.test(upstreamPath)) {
    return new Response('undecodable image format', { status: 404 })
  }
  const upstreamResponse = await fetch(
    NASA_IMAGE_HREF_PREFIX.slice(0, -1) + upstreamPath,
  )
  if (!upstreamResponse.ok) {
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
    })
  }
  // the cap is enforced on the declared length, and a declaration is
  // required: counting bytes mid-stream cannot retract a 200 already sent,
  // so an over-cap stream would truncate into the CDN's cache. NASA serves
  // static files that always declare a size.
  const contentLength = Number(upstreamResponse.headers.get('content-length'))
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    await upstreamResponse.body?.cancel()
    return new Response('upstream response did not declare a size', {
      status: 502,
    })
  }
  if (contentLength > NASA_IMAGE_SOURCE_MAX_BYTES) {
    await upstreamResponse.body?.cancel()
    return new Response('image exceeds the rendition byte cap', {
      status: 413,
    })
  }
  return new Response(upstreamResponse.body, {
    status: 200,
    headers: {
      'content-type':
        upstreamResponse.headers.get('content-type') ??
        'application/octet-stream',
      'cache-control': 'public, max-age=604800',
      'netlify-cdn-cache-control': 'public, durable, s-maxage=31536000',
    },
  })
}

export const config = { path: `${NASA_IMAGE_SOURCE_PREFIX}/*` }
