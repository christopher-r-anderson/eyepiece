import {
  NASA_IMAGE_ORIGIN,
  NASA_IMAGE_SOURCE_PREFIX,
  // the explicit extension is for the Deno edge bundler
} from '../../src/domain/provider/provider-image-delivery.ts'

// Same-site source for the image CDN's NASA fetches (#253). Transformed
// responses inherit the source's cache headers, and NASA's own origin serves
// max-age=300 - fetched directly, every transform would go stale in five
// minutes. The durable directive keeps the source cached across deploys.
export default async (request: Request) => {
  const url = new URL(request.url)
  const upstream =
    NASA_IMAGE_ORIGIN + url.pathname.slice(NASA_IMAGE_SOURCE_PREFIX.length)
  const upstreamResponse = await fetch(upstream)
  if (!upstreamResponse.ok) {
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
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
