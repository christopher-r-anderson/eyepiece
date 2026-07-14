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

test('all scope renders publicly cacheable with tabs and no console errors', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page)
  const searchRequests = trackSearchApiRequests(page)

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

  expect(searchRequests).toEqual([])
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
  await page.route('**/api/v1/search*', (route) =>
    route.fulfill({ json: stubSearchResponse }),
  )

  await page.goto(`/search?q=moon&providerId=${NASA_PROVIDER_ID}`)

  await page.waitForURL(
    (url) => url.search === `?providerId=${NASA_PROVIDER_ID}&q=moon`,
  )
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

test('switching to a provider scope loads results and back returns to all', async ({
  page,
}) => {
  await page.route('**/api/v1/search*', (route) =>
    route.fulfill({ json: stubSearchResponse }),
  )
  await page.goto('/search?q=moon')

  await page
    .getByRole('navigation', { name: 'Search scope' })
    .getByRole('link', { name: 'NASA' })
    .click()

  await page.waitForURL((url) => {
    return (
      url.searchParams.get('q') === 'moon' &&
      url.searchParams.get('providerId') === NASA_PROVIDER_ID
    )
  })
  await expect(page.getByText('Apollo 11 Capsule')).toBeVisible()

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
