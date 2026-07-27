import { expect, test } from './fixtures'
import { TINY_PNG } from './support/collections-helpers'
import type { Page } from '@playwright/test'
import { SHOWCASE_CURATION } from '@/features/collections/collections.showcase'
import {
  FEATURED_ALBUMS,
  SUGGESTED_SEARCHES,
} from '@/features/home/home.curation'

function collectConsoleErrors(page: Page) {
  const errors: Array<string> = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  return errors
}

test('homepage renders masthead, chips, strips, and collection cards', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page)
  // thumbnails come from live provider CDNs; a stub bitmap keeps flaky
  // image fetches from polluting the console-error check
  await page.route('**/*.{jpg,jpeg,png}', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )

  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  expect(response?.headers()['cache-control']).toContain('public')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'A personal view of public space photography',
    }),
  ).toBeVisible()

  const firstChip = SUGGESTED_SEARCHES[0]
  await expect(
    page.getByRole('link', { name: firstChip, exact: true }),
  ).toHaveAttribute('href', `/search?q=${firstChip.replaceAll(' ', '+')}`)

  for (const featured of FEATURED_ALBUMS) {
    const section = page.getByRole('region', {
      name: `editor’s picks ${featured.title}`,
    })
    await expect(
      section.getByRole('link', { name: 'See the album' }),
    ).toHaveAttribute(
      'href',
      `/albums/${featured.albumKey.providerId}/${featured.albumKey.externalId}`,
    )
  }
  // strips stream from the live album API, which this suite can't stub;
  // the section must settle into tiles or its boundary, never hang empty
  const firstStrip = page.getByRole('region', {
    name: `editor’s picks ${FEATURED_ALBUMS[0].title}`,
  })
  await expect(
    firstStrip.getByRole('listitem').first().or(firstStrip.getByRole('alert')),
  ).toBeVisible({ timeout: 20000 })

  for (const collection of SHOWCASE_CURATION.collections) {
    await expect(
      page.getByRole('link', { name: new RegExp(collection.name) }),
    ).toHaveAttribute('href', `/collections/${collection.id}`)
  }
  await expect(page.getByText('curated by')).toHaveCount(
    SHOWCASE_CURATION.collections.length,
  )

  // the strips stream from the live album API, and a fetch that
  // legitimately fails into a section boundary logs the error; the
  // clean-console check (insurance against hydration warnings) only
  // applies when every section settled
  if ((await page.getByRole('alert').count()) === 0) {
    expect(consoleErrors).toEqual([])
  }
})
