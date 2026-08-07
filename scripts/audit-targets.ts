// Shared page list for the audit scripts: one URL per template. Album and
// collection paths vary per environment, so they resolve from the target's
// /sitemap.xml with production fallbacks.
export interface AuditTarget {
  name: string
  path: string
  // all must hold before auditing; sections stream independently, so one
  // settling proves nothing about the others and a skeleton would audit
  // vacuously
  ready: Array<{ selector: string; count?: number }>
  // needs a session cookie; the scripts skip auth targets
  auth?: boolean
}

const fallbackTargets = {
  album: '/albums/nasa_ivl/Apollo-at-50',
  collection: '/collections/21c33a8c-f642-410a-9188-11054399140f',
}

export async function resolveAuditTargets(
  baseUrl: string,
): Promise<Array<AuditTarget>> {
  let album = fallbackTargets.album
  let collection = fallbackTargets.collection
  try {
    const response = await fetch(new URL('/sitemap.xml', baseUrl))
    if (!response.ok)
      throw new Error(`sitemap fetch failed: ${response.status}`)
    const xml = await response.text()
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => new URL(match[1]).pathname,
    )
    album = paths.find((path) => path.startsWith('/albums/')) ?? album
    collection =
      paths.find((path) => path.startsWith('/collections/')) ?? collection
  } catch (error) {
    process.stderr.write(
      `sitemap unavailable, using production fallbacks (${String(error)})\n`,
    )
  }
  const tile = [{ selector: '[data-asset-key]' }]
  const tileSection = 'section:has([data-asset-key])'
  return [
    {
      name: 'home',
      path: '/',
      // two featured album strips plus the public-collections section
      ready: [
        { selector: tileSection, count: 2 },
        { selector: 'section a[href^="/collections/"]' },
      ],
    },
    {
      name: 'search-all',
      path: '/search?q=apollo',
      ready: [{ selector: tileSection, count: 2 }],
    },
    {
      name: 'search-scoped',
      path: '/search?providerId=nasa_ivl&q=nebula',
      ready: tile,
    },
    {
      name: 'asset-detail',
      path: '/assets/nasa_ivl/PIA14417',
      ready: [{ selector: 'main img' }],
    },
    { name: 'collection-detail', path: collection, ready: tile },
    { name: 'album', path: album, ready: tile },
    { name: 'login', path: '/login', ready: [{ selector: 'form' }] },
  ]
}

// ids.si.edu serves an HTML block page to Headless Chrome user agents
// (ERR_BLOCKED_BY_ORB on every SI image), so audits must run with a real UA.
export const DESKTOP_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
export const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 12; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
