import { expect, test } from './fixtures'

const DEFAULT_TITLE = 'eyepiece: NASA Media Explorer'

// a parse failure means the tag leaked markup
function jsonLdNodes(html: string) {
  return [
    ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs),
  ].map((match) => JSON.parse(match[1]) as Record<string, unknown>)
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

  await expect(page).toHaveTitle(`Search | ${DEFAULT_TITLE}`)
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
