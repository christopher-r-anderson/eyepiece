import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'
import { stubFixtureImages } from './support/collections-helpers'

const { user, publicCollection, privateCollection, pagingCollection } =
  COLLECTIONS_FIXTURE
const { privateOnlyUser } = COLLECTIONS_FIXTURE

test('profile lists the public collections and hides private ones', async ({
  page,
}) => {
  await stubFixtureImages(page)
  await page.goto(`/profile/${user.id}`)

  await expect(
    page.getByRole('heading', { level: 2, name: user.displayName }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 2, name: 'Public collections' }),
  ).toBeVisible()
  // item counts stay unasserted: parallel specs add and remove rows in
  // these collections, so only names and targets are stable
  await expect(
    page.getByRole('link', { name: publicCollection.name }),
  ).toHaveAttribute('href', `/collections/${publicCollection.id}`)
  await expect(
    page.getByRole('link', { name: pagingCollection.name }),
  ).toHaveAttribute('href', `/collections/${pagingCollection.id}`)
  await expect(page.getByText(privateCollection.name)).toHaveCount(0)
})

test('profile with only a private collection shows the empty state', async ({
  page,
}) => {
  await page.goto(`/profile/${privateOnlyUser.id}`)

  await expect(
    page.getByRole('heading', { level: 2, name: privateOnlyUser.displayName }),
  ).toBeVisible()
  await expect(page.getByText('No public collections yet.')).toBeVisible()
  await expect(page.getByText(privateOnlyUser.collection.name)).toHaveCount(0)
})

// `netlify serve` retries a 404 against static-file spellings (.html,
// /index.html, ...) and hands the client the LAST probe's body, which is
// the router's global not-found rather than the route-level one this route
// renders on real Netlify. The spec therefore pins the status and a body
// that works in both environments.
test('unknown and malformed profile ids are not found', async ({ page }) => {
  const unknownResponse = await page.goto(
    '/profile/e2e00000-0000-4000-8000-00000000dead',
  )
  expect(unknownResponse?.status()).toBe(404)
  await expect(page.getByText(/not found/i).first()).toBeVisible()

  const malformedResponse = await page.goto('/profile/not-a-uuid')
  expect(malformedResponse?.status()).toBe(404)
  await expect(page.getByText(/not found/i).first()).toBeVisible()
})
