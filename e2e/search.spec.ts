import { expect, test } from './fixtures'
import type { Page } from '@playwright/test'

const NASA_PROVIDER_ID = 'nasa_ivl'

function stubAsset(externalId: string, title: string) {
  const image = {
    href: `https://images-assets.nasa.gov/image/${externalId}/${externalId}~thumb.jpg`,
    width: 640,
    height: 480,
  }
  return {
    key: { providerId: NASA_PROVIDER_ID, externalId },
    title,
    thumbnail: image,
    description: `${title} description`,
    image,
    original: image,
  }
}

const stubSearchResponse = {
  items: [
    stubAsset('apollo-11-capsule', 'Apollo 11 Capsule'),
    stubAsset('apollo-11-crew', 'Apollo 11 Crew'),
  ],
  pagination: { next: null, total: 2 },
}

function collectConsoleErrors(page: Page) {
  const errors: Array<string> = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  return errors
}

function trackSearchApiRequests(page: Page) {
  const requests: Array<string> = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/search')) {
      requests.push(request.url())
    }
  })
  return requests
}

test('all scope renders publicly cacheable with sections and no console errors', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page)
  // stub client refetches so the test does not depend on provider health
  await page.route('**/api/v1/search*', (route) =>
    route.fulfill({ json: stubSearchResponse }),
  )

  const response = await page.goto('/search?q=moon')

  expect(response?.status()).toBe(200)
  expect(response?.headers()['cache-control']).toContain('public')

  await expect(
    page.getByRole('heading', { name: 'Search for "moon"' }),
  ).toBeVisible()
  const scopeNav = page.getByRole('navigation', { name: 'Search scope' })
  await expect(scopeNav.getByRole('link')).toHaveText([
    'All libraries',
    'NASA',
    'Smithsonian',
  ])
  await expect(
    scopeNav.getByRole('link', { name: 'All libraries' }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(
    page.getByRole('region', { name: 'NASA Image and Video Library' }),
  ).toBeVisible()
  await expect(
    page.getByRole('region', {
      name: 'Smithsonian National Air and Space Museum',
    }),
  ).toBeVisible()

  expect(consoleErrors).toEqual([])
})

test('missing query renders the prompt state without firing searches', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page)
  const searchRequests = trackSearchApiRequests(page)

  const response = await page.goto('/search')

  expect(response?.status()).toBe(200)
  await expect(page.getByText('Enter search keywords')).toBeVisible()

  expect(searchRequests).toEqual([])
  expect(consoleErrors).toEqual([])
})

test('junk search params canonicalize away by replacement', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page)

  const response = await page.goto(
    '/search?q=moon&providerId=bogus&utm_source=newsletter',
  )

  expect(response?.status()).toBe(200)
  await page.waitForURL((url) => {
    return (
      url.pathname === '/search' &&
      url.searchParams.get('q') === 'moon' &&
      !url.searchParams.has('providerId') &&
      !url.searchParams.has('utm_source')
    )
  })
  await expect(
    page
      .getByRole('navigation', { name: 'Search scope' })
      .getByRole('link', { name: 'All libraries' }),
  ).toHaveAttribute('aria-current', 'page')
  expect(consoleErrors).toEqual([])
})

test('param-order variants canonicalize to one sorted spelling', async ({
  page,
}) => {
  // no q, so nothing is prefetched during SSR and the test stays hermetic
  await page.goto('/search?fp=1&auth=login')

  await page.waitForURL((url) => url.search === '?auth=login&fp=1')
})

test('home submits to the all scope with the query preserved', async ({
  page,
}) => {
  await page.goto('/')

  // a fill that lands before hydration is wiped by the controlled input;
  // retry until the value sticks (flaked on webkit)
  const searchbox = page.getByRole('searchbox', { name: 'Search keywords' })
  await expect(async () => {
    await searchbox.fill('moon')
    await page.waitForTimeout(150)
    await expect(searchbox).toHaveValue('moon')
  }).toPass()
  await page.getByRole('button', { name: 'Search', exact: true }).click()

  await page.waitForURL((url) => {
    return (
      url.pathname === '/search' &&
      url.searchParams.get('q') === 'moon' &&
      !url.searchParams.has('providerId')
    )
  })
  await expect(
    page
      .getByRole('navigation', { name: 'Search scope' })
      .getByRole('link', { name: 'All libraries' }),
  ).toHaveAttribute('aria-current', 'page')
})

test('all-view sections load once and "See all" reuses the cache', async ({
  page,
}) => {
  const searchRequests = trackSearchApiRequests(page)
  await page.route('**/api/v1/search*', (route) =>
    route.fulfill({ json: stubSearchResponse }),
  )
  // start from the prompt state so all fetching goes through the stub
  await page.goto('/search')

  const searchbox = page.getByRole('searchbox', { name: 'Search keywords' })
  await expect(async () => {
    await searchbox.fill('moon')
    await page.waitForTimeout(150)
    await expect(searchbox).toHaveValue('moon')
  }).toPass()
  await page.getByRole('button', { name: 'Search', exact: true }).click()

  await page.waitForURL((url) => url.searchParams.get('q') === 'moon')
  const nasaSection = page.getByRole('region', {
    name: 'NASA Image and Video Library',
  })
  await expect(nasaSection.getByText('Apollo 11 Capsule').first()).toBeVisible()
  const requestsAfterSections = searchRequests.length
  expect(requestsAfterSections).toBeGreaterThan(0)

  await nasaSection.getByRole('link', { name: 'See all from NASA' }).click()
  await page.waitForURL((url) => {
    return (
      url.searchParams.get('q') === 'moon' &&
      url.searchParams.get('providerId') === NASA_PROVIDER_ID
    )
  })
  await expect(page.getByText('Apollo 11 Capsule').first()).toBeVisible()
  // the scoped tab shares the section's query cache: no new fetch
  expect(searchRequests.length).toBe(requestsAfterSections)

  await page.goBack()
  await page.waitForURL((url) => {
    return (
      url.searchParams.get('q') === 'moon' &&
      !url.searchParams.has('providerId')
    )
  })
  await expect(
    page
      .getByRole('navigation', { name: 'Search scope' })
      .getByRole('link', { name: 'All libraries' }),
  ).toHaveAttribute('aria-current', 'page')
})

test('a failing provider only takes down its own section', async ({ page }) => {
  await page.route('**/api/v1/search*', (route) => {
    const url = new URL(route.request().url())
    if (url.searchParams.get('providerId') === 'si_oa') {
      return route.fulfill({ status: 502, json: { error: 'upstream down' } })
    }
    return route.fulfill({ json: stubSearchResponse })
  })
  await page.goto('/search')

  const searchbox = page.getByRole('searchbox', { name: 'Search keywords' })
  await expect(async () => {
    await searchbox.fill('moon')
    await page.waitForTimeout(150)
    await expect(searchbox).toHaveValue('moon')
  }).toPass()
  await page.getByRole('button', { name: 'Search', exact: true }).click()

  const nasaSection = page.getByRole('region', {
    name: 'NASA Image and Video Library',
  })
  await expect(nasaSection.getByText('Apollo 11 Capsule').first()).toBeVisible()
  const siSection = page.getByRole('region', {
    name: 'Smithsonian National Air and Space Museum',
  })
  await expect(siSection.getByRole('alert')).toContainText(
    "Couldn't load results from Smithsonian National Air and Space Museum.",
  )
})

test('provider scope server-renders the media type select and hydrates cleanly', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page)
  await page.route('**/api/v1/search*', (route) =>
    route.fulfill({ json: stubSearchResponse }),
  )

  const response = await page.goto(
    `/search?q=moon&providerId=${NASA_PROVIDER_ID}`,
  )
  expect(response?.status()).toBe(200)

  // the real select (including its hidden <select>) ships in the server
  // HTML; there is no client-only placeholder swap after hydration
  const serverHtml = (await response?.text()) ?? ''
  expect(serverHtml).toContain('<select')

  // a click that lands before hydration is a no-op; retry until the
  // listbox actually opens
  const mediaTypeSelect = page.getByRole('button', { name: 'All Media Type' })
  await expect(async () => {
    await mediaTypeSelect.click()
    await expect(page.getByRole('option', { name: 'Video' })).toBeVisible({
      timeout: 1000,
    })
  }).toPass()
  await page.getByRole('option', { name: 'Video' }).click()
  await expect(
    page.getByRole('button', { name: 'Video Media Type' }),
  ).toBeVisible()

  expect(consoleErrors).toEqual([])
})

test('exactly one scope tab is marked current in provider scope', async ({
  page,
}) => {
  await page.route('**/api/v1/search*', (route) =>
    route.fulfill({ json: stubSearchResponse }),
  )

  await page.goto(`/search?q=moon&providerId=${NASA_PROVIDER_ID}`)

  const scopeNav = page.getByRole('navigation', { name: 'Search scope' })
  await expect(scopeNav.getByText('NASA')).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(scopeNav.locator('[aria-current="page"]')).toHaveCount(1)
})
