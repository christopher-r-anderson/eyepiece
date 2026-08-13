// Shared plumbing for the audit scripts: the page-template list (one URL per
// template), readiness conditions, and CLI/report helpers. Album and
// collection paths vary per environment, so they resolve from the target's
// /sitemap.xml with production fallbacks.
import fs from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'

export interface AuditTarget {
  name: string
  path: string
  // all must hold before auditing; sections stream independently, so one
  // settling proves nothing about the others, and an audit of a skeleton
  // proves nothing at all
  ready: Array<{ selector: string; count?: number }>
  // needs a session cookie; the scripts skip auth targets
  auth?: boolean
}

const fallbackTargets = {
  album: '/albums/nasa_ivl/Apollo-at-50',
  collection: '/collections/21c33a8c-f642-410a-9188-11054399140f',
}

async function resolveAuditTargets(
  baseUrl: string,
): Promise<Array<AuditTarget>> {
  let album = fallbackTargets.album
  let collection: string | null = fallbackTargets.collection
  try {
    const response = await fetch(new URL('/sitemap.xml', baseUrl), {
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok)
      throw new Error(`sitemap fetch failed: ${response.status}`)
    const xml = await response.text()
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => new URL(match[1]!).pathname,
    )
    album = paths.find((pathname) => pathname.startsWith('/albums/')) ?? album
    // a reachable sitemap with no collections means the target has none;
    // the production fallback would 404 there
    collection =
      paths.find((pathname) => pathname.startsWith('/collections/')) ?? null
  } catch (error) {
    process.stderr.write(
      `sitemap unavailable, using production fallbacks (${String(error)})\n`,
    )
  }
  const tile = [{ selector: '[data-asset-key]' }]
  const tileSection = 'section:has([data-asset-key])'
  // sitemap-resolved pages can be legitimately empty; their settled empty
  // state counts as ready
  const tileOrEmpty = [
    { selector: '[data-asset-key], [data-audit-empty-state]' },
  ]
  const targets: Array<AuditTarget> = [
    {
      name: 'home',
      path: '/',
      // two featured album strips plus the public-collections section
      // (cards or its settled empty state)
      ready: [
        { selector: tileSection, count: 2 },
        {
          selector:
            'section :is(a[href^="/collections/"], [data-audit-empty-state])',
        },
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
    ...(collection === null
      ? []
      : [{ name: 'collection-detail', path: collection, ready: tileOrEmpty }]),
    { name: 'album', path: album, ready: tileOrEmpty },
    // the header search is also a form; only the login form proves the
    // route rendered
    { name: 'login', path: '/login', ready: [{ selector: 'main form' }] },
  ]
  if (collection === null) {
    process.stderr.write(
      'target has no public collections; skipping collection-detail\n',
    )
  }
  return targets
}

export function cliArgs() {
  // pnpm forwards a literal "--" when invoked as `pnpm audit:x -- --y`
  return process.argv
    .slice(2)
    .filter((arg, index) => !(index === 0 && arg === '--'))
}

export function parseBaseUrl(base: string) {
  const baseUrl = base.replace(/\/$/, '')
  if (!/^https?:\/\//.test(baseUrl))
    throw new Error(`--base must include http:// or https://`)
  return baseUrl
}

export async function selectAuditTargets(baseUrl: string, only?: string) {
  const targets = (await resolveAuditTargets(baseUrl)).filter(
    (target) => !target.auth,
  )
  const names = only?.split(',')
  if (!names) return targets
  const unknown = names.filter(
    (name) => !targets.some((target) => target.name === name),
  )
  if (unknown.length > 0)
    throw new Error(`--only: unknown template(s): ${unknown.join(', ')}`)
  return targets.filter((target) => names.includes(target.name))
}

export function waitForReady(page: Page, target: AuditTarget) {
  return page.waitForFunction(
    (conditions) =>
      conditions.every(
        ({ selector, count }) =>
          document.querySelectorAll(selector).length >= (count ?? 1),
      ),
    target.ready,
    { timeout: 30_000 },
  )
}

export function makeReportDir(kind: string, baseUrl: string) {
  const stamp = `${new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '')}-${process.pid}`
  // ipv6 hostnames carry characters windows paths reject
  const host = new URL(baseUrl).hostname.replace(/[^\w.-]/g, '-')
  const dir = path.join('audit-reports', `${kind}-${host}-${stamp}`)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

// ids.si.edu serves an HTML block page to Headless Chrome user agents
// (ERR_BLOCKED_BY_ORB on every SI image), so audits must run with a real UA.
export const DESKTOP_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
export const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 12; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
