import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'

const DEFAULT_TITLE = 'Eyepiece: astronomy image search and collections'

// a parse failure means the tag leaked markup
function jsonLdNodes(html: string) {
  return [
    ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs),
  ].map((match) => JSON.parse(match[1]!) as Record<string, unknown>)
}

test('routes without a specific title get the default', async ({ page }) => {
  const response = await page.goto('/')

  // the default ships in the server HTML, not just after hydration
  expect(await response?.text()).toContain(`<title>${DEFAULT_TITLE}</title>`)
  await expect(page).toHaveTitle(DEFAULT_TITLE)

  await page.goto('/login')
  await expect(page).toHaveTitle(DEFAULT_TITLE)
})

test('routes with their own title override the default', async ({ page }) => {
  // no q, so nothing is prefetched during SSR and no provider requests fire
  await page.goto('/search')

  await expect(page).toHaveTitle('Search | Eyepiece')
})

test('the server document carries the default social preview', async ({
  page,
}) => {
  const response = await page.goto('/')
  const html = (await response?.text()) ?? ''

  expect(html).toContain(
    '<meta property="og:image" content="https://eyepiece.net/og.jpg"/>',
  )
  expect(html).toContain('<meta property="og:site_name" content="eyepiece"/>')
})

test('an asset page overrides the social preview with its own image', async ({
  page,
}) => {
  const response = await page.goto('/assets/nasa_ivl/PIA14417')
  const html = (await response?.text()) ?? ''

  const ogImage = html.match(
    /<meta property="og:image" content="([^"]*)"/g,
  ) as Array<string>
  // exactly one og:image, and it is the asset's rendition, not the default
  expect(ogImage).toHaveLength(1)
  expect(ogImage[0]).toContain('images-assets.nasa.gov')
})

test('the home document carries its canonical address and WebSite node', async ({
  page,
}) => {
  const response = await page.goto('/')
  const html = (await response?.text()) ?? ''

  expect(html).toContain('<link rel="canonical" href="https://eyepiece.net/"/>')
  expect(html).toContain(
    '<meta property="og:url" content="https://eyepiece.net/"/>',
  )

  const site = jsonLdNodes(html).find((node) => node['@type'] === 'WebSite')
  expect(site).toMatchObject({
    url: 'https://eyepiece.net/',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://eyepiece.net/search?q={search_term_string}',
    },
  })
})

test('an asset page carries its canonical address and ImageObject node', async ({
  page,
}) => {
  const response = await page.goto('/assets/nasa_ivl/PIA14417')
  const html = (await response?.text()) ?? ''
  const canonical = 'https://eyepiece.net/assets/nasa_ivl/PIA14417'

  expect(html).toContain(`<link rel="canonical" href="${canonical}"/>`)
  expect(html).toContain(`<meta property="og:url" content="${canonical}"/>`)
  // exactly one canonical: the root emits none
  expect(html.match(/rel="canonical"/g)).toHaveLength(1)

  const nodes = jsonLdNodes(html)
  const image = nodes.find((node) => node['@type'] === 'ImageObject')
  expect(image?.mainEntityOfPage).toBe(canonical)
  expect(image?.contentUrl).toContain('images-assets.nasa.gov')
  expect(image?.name).toBeTruthy()
  // NASA nodes point at usage guidelines rather than claiming a license
  expect(image?.acquireLicensePage).toContain('nasa.gov')
  expect(image).not.toHaveProperty('license')
})

test('a Smithsonian asset page claims the CC0 license', async ({ page }) => {
  const response = await page.goto(
    '/assets/si_oa/ld1-1643400021979-1643400026580-0',
  )
  const html = (await response?.text()) ?? ''

  const image = jsonLdNodes(html).find(
    (node) => node['@type'] === 'ImageObject',
  )
  expect(image?.license).toContain('creativecommons.org/publicdomain/zero')
  expect(image).not.toHaveProperty('acquireLicensePage')
})

test('an album document carries its canonical address and CollectionPage node', async ({
  page,
}) => {
  const response = await page.goto('/albums/nasa_ivl/Apollo-at-50')
  const html = (await response?.text()) ?? ''
  const canonical = 'https://eyepiece.net/albums/nasa_ivl/Apollo-at-50'

  expect(html).toContain(`<link rel="canonical" href="${canonical}"/>`)
  expect(html).toContain(`<meta property="og:url" content="${canonical}"/>`)

  const collection = jsonLdNodes(html).find(
    (node) => node['@type'] === 'CollectionPage',
  )
  expect(collection?.url).toBe(canonical)
  expect(collection?.name).toBeTruthy()
})

test('a collection document carries its canonical address and CollectionPage node', async ({
  page,
}) => {
  const { publicCollection } = COLLECTIONS_FIXTURE
  const response = await page.goto(`/collections/${publicCollection.id}`)
  const html = (await response?.text()) ?? ''
  const canonical = `https://eyepiece.net/collections/${publicCollection.id}`

  expect(html).toContain(`<link rel="canonical" href="${canonical}"/>`)
  expect(html).toContain(`<meta property="og:url" content="${canonical}"/>`)

  const collection = jsonLdNodes(html).find(
    (node) => node['@type'] === 'CollectionPage',
  )
  expect(collection?.url).toBe(canonical)
  expect(collection?.name).toBe(publicCollection.name)
})

test('the server document preloads the detail image', async ({ page }) => {
  const response = await page.goto('/assets/nasa_ivl/PIA14417')
  const html = (await response?.text()) ?? ''

  // React hoists this from the img's fetchPriority. Attribute casing
  // follows the React version, so match it insensitively.
  const preload = html
    .toLowerCase()
    .match(/<link rel="preload"[^>]*as="image"[^>]*>/g)
  expect(preload).toHaveLength(1)
  expect(preload?.[0]).toContain('fetchpriority="high"')
  expect(preload?.[0]).toContain('imagesrcset=')
  expect(preload?.[0]).toContain('imagesizes=')
})
