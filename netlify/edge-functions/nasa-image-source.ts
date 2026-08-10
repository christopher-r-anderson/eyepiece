import {
  NASA_IMAGE_HREF_PREFIX,
  NASA_IMAGE_SOURCE_MAX_BYTES,
  NASA_IMAGE_SOURCE_PREFIX,
  UNDECODABLE_IMAGE_PATTERN,
  // the explicit extension is for the Deno edge bundler
} from '../../src/domain/provider/provider-image-delivery.ts'

// Serves NASA image bytes under our cache headers so the image CDN's
// transforms inherit them (docs/Providers.md, Image Delivery). Publicly
// reachable, so it rejects by path and size.
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
  // the size limit needs a declared length: aborting mid-stream cannot
  // retract the 200, and a truncated body would cache as complete
  const contentLength = Number(upstreamResponse.headers.get('content-length'))
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    await upstreamResponse.body?.cancel()
    return new Response('upstream response did not declare a size', {
      status: 502,
    })
  }
  if (contentLength > NASA_IMAGE_SOURCE_MAX_BYTES) {
    await upstreamResponse.body?.cancel()
    return new Response('image exceeds the size limit', {
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
      // durable: survives deploys
      'netlify-cdn-cache-control': 'public, durable, s-maxage=31536000',
    },
  })
}

export const config = { path: `${NASA_IMAGE_SOURCE_PREFIX}/*` }
