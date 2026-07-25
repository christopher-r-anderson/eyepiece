import { expect, test } from './fixtures'
import { SHOWCASE_CURATION } from '@/features/collections/collections.showcase'
import {
  FEATURED_ALBUMS,
  SUGGESTED_SEARCHES,
} from '@/features/home/home.curation'

test('homepage renders masthead, chips, strips, and collection cards', async ({
  page,
}) => {
  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  expect(response?.headers()['cache-control']).toContain('public')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'A personal view of public space photography',
    }),
  ).toBeVisible()

  // chips link to canonical /search spellings (spaces spelled as '+')
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
  // strip tiles come from the live album API during SSR streaming, which
  // this suite cannot stub; the section must settle into one of its two
  // designed states - tiles or its own error boundary - never an empty hang
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
})
