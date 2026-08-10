import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PROVIDER_IMAGE_DELIVERY } from './provider.schema'

// netlify.toml cannot read PROVIDER_IMAGE_DELIVERY, so these assert the
// [images] allowlist matches it: every directly-fetched prefix is
// allowlisted, and same-site prefixes are not.

function remoteImagePatterns() {
  // vitest runs with the workspace root as cwd; import.meta.url is an
  // http url under jsdom, so it cannot anchor the path
  const toml = readFileSync(resolve(process.cwd(), 'netlify.toml'), 'utf-8')
  const list = toml.match(/remote_images\s*=\s*\[([^\]]*)\]/)?.[1]
  expect(list, 'netlify.toml is missing [images] remote_images').toBeDefined()
  const patterns = [...list!.matchAll(/"([^"]+)"/g)].map(
    // TOML basic strings escape the backslashes the regexes need
    (match) => new RegExp(`^${match[1].replaceAll('\\\\', '\\')}$`),
  )
  expect(patterns.length).toBeGreaterThan(0)
  return patterns
}

const sampleFor = (hrefPrefix: string) => `${hrefPrefix}some/id/image.jpg`

describe('image delivery artifacts stay in sync', () => {
  it('allowlists everything a remote-source policy can emit', () => {
    const patterns = remoteImagePatterns()
    for (const policy of Object.values(PROVIDER_IMAGE_DELIVERY)) {
      if (policy.source !== 'remote') continue
      const sample = sampleFor(policy.hrefPrefix)
      expect(
        patterns.some((pattern) => pattern.test(sample)),
        `${policy.hrefPrefix} is a remote image source but no netlify.toml remote_images pattern matches ${sample}`,
      ).toBe(true)
    }
  })

  it('does not allowlist prefixes that route through a same-site source', () => {
    const patterns = remoteImagePatterns()
    for (const policy of Object.values(PROVIDER_IMAGE_DELIVERY)) {
      if (policy.source === 'remote') continue
      const sample = sampleFor(policy.hrefPrefix)
      expect(
        patterns.some((pattern) => pattern.test(sample)),
        `${policy.hrefPrefix} routes through ${policy.source.pathPrefix} and should not also be an open remote source`,
      ).toBe(false)
    }
  })
})
