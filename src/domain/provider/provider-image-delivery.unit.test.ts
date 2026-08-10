import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { config as nasaSourceConfig } from '../../../netlify/edge-functions/nasa-image-source'
import { NASA_IMAGE_SOURCE_PREFIX } from './provider-image-delivery'
import { PROVIDER_IMAGE_DELIVERY } from './provider.schema'

// The netlify.toml allowlist and the edge function route cannot read
// PROVIDER_IMAGE_DELIVERY, so drift between the artifacts would surface as
// production 400s. These assertions hold them together instead.

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

// what the builder would emit for a rendition carrying the policy's prefix
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

  it('serves the NASA same-site source on the configured prefix', () => {
    expect(PROVIDER_IMAGE_DELIVERY.nasa_ivl.source).toEqual({
      pathPrefix: NASA_IMAGE_SOURCE_PREFIX,
    })
    expect(nasaSourceConfig.path).toBe(`${NASA_IMAGE_SOURCE_PREFIX}/*`)
  })
})
