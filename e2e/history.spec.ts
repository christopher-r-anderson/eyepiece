import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'
import {
  createPasswordProbeUser,
  deleteUserByEmail,
} from './support/admin-users'
import { TINY_PNG } from './support/collections-helpers'
import { singleRenditionImage } from './support/asset-image'
import {
  deleteUserFavorite,
  seedUserFavorite,
} from './support/favorites-fixture'
import type { Page } from '@playwright/test'

const { publicCollection, snapshots } = COLLECTIONS_FIXTURE
const wideSnapshot = snapshots[0]

// Closing a dialog must never push history forward: an app-pushed open is
// consumed with a real back(), a deep-linked open closes by replace.

// client-side navigation fetches the asset through /api/v1 in the browser,
// so these journeys serve it themselves; only the deep-link spec needs a
// fresh document and has to hit the live provider during SSR
async function stubAssetApi(page: Page) {
  const image = singleRenditionImage(
    `https://images-assets.nasa.gov/image/${wideSnapshot.externalId}/${wideSnapshot.externalId}~thumb.jpg`,
    wideSnapshot.width,
    wideSnapshot.height,
  )
  await page.route(
    `**/api/v1/asset/nasa_ivl/${wideSnapshot.externalId}/metadata`,
    (route) => route.fulfill({ json: { instrument: 'stub' } }),
  )
  await page.route(
    `**/api/v1/asset/nasa_ivl/${wideSnapshot.externalId}`,
    (route) =>
      route.fulfill({
        json: {
          key: { providerId: 'nasa_ivl', externalId: wideSnapshot.externalId },
          title: wideSnapshot.title,
          description: 'Stubbed asset for the history journey',
          image,
        },
      }),
  )
}

test('the metadata disclosure expands in place with no history entry', async ({
  page,
}) => {
  await stubAssetApi(page)
  await page.route(
    `**/api/v1/asset/nasa_ivl/${wideSnapshot.externalId}/metadata`,
    (route) => route.fulfill({ json: { Camera: 'E2E Cam' } }),
  )
  await page.goto(`/collections/${publicCollection.id}`)
  // enabled star = hydrated (tile links work pre-hydration, the
  // disclosure does not)
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()
  await page.getByRole('link', { name: wideSnapshot.title }).click()
  await page.waitForURL(`/assets/nasa_ivl/${wideSnapshot.externalId}`)

  const trigger = page.getByRole('button', { name: 'Metadata' })
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  const lengthBefore = await page.evaluate(() => history.length)
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('cell', { name: 'E2E Cam' })).toBeVisible()
  expect(await page.evaluate(() => location.hash)).toBe('')
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore)

  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore)

  await page.goBack()
  await page.waitForURL(`/collections/${publicCollection.id}`)
})

test('a legacy #metadata deep link renders the page without a dialog', async ({
  page,
}) => {
  // a fresh document can't be stubbed from the page, so this uses a
  // stable live NASA record (the same exposure the search specs carry);
  // the dialog is retired, so the old hash spelling must land inert
  await page.goto('/assets/nasa_ivl/PIA14417#metadata')
  await expect(page.getByRole('button', { name: 'Metadata' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(await page.evaluate(() => location.pathname)).toBe(
    '/assets/nasa_ivl/PIA14417',
  )
})

test('a legacy auth param does not open the dialog', async ({ page }) => {
  // the modal's state left the URL (#218); an inbound ?auth is a stranger
  // param and the full /login page is the addressable spelling
  await page.goto(`/collections/${publicCollection.id}?auth=login`)
  await expect(page.getByRole('grid')).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('the auth dialog occupies one history entry from open to close', async ({
  page,
}) => {
  // the extra prior entry lets the final goBack distinguish a real
  // back-close from a same-URL replace
  await page.goto('/')
  await page.goto(`/collections/${publicCollection.id}`)
  const tile = page.getByRole('grid').getByRole('row').first()
  await expect(tile.getByRole('button', { name: 'Star' })).toBeEnabled()
  // the veil must be revealed before its controls take the pointer
  await tile.hover()

  const lengthBefore = await page.evaluate(() => history.length)
  await tile.getByRole('button', { name: 'Star' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  // the modal lives in history state, never the URL
  expect(await page.evaluate(() => location.search)).toBe('')
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  await page.getByRole('link', { name: 'Forgot Password?' }).click()
  await expect(page.getByRole('form', { name: 'Reset Password' })).toBeVisible()
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  await page.getByRole('link', { name: 'Back to log in' }).click()
  await expect(page.getByRole('form', { name: 'Log In' })).toBeVisible()
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  await page.getByRole('tab', { name: 'Register' }).click()
  await expect(page.getByRole('tab', { name: 'Register' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  await page
    .getByRole('button', { name: 'Close Log In or Register dialog' })
    .click()
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)
  expect(await page.evaluate(() => location.pathname)).toBe(
    `/collections/${publicCollection.id}`,
  )

  await page.goBack()
  await page.waitForURL('/')
  await expect(page.getByRole('dialog')).toBeHidden()
})

test(
  'an auth-required action on a private page opens the modal as one entry',
  { tag: '@user' },
  async ({ page }, testInfo) => {
    const fixture = {
      id: `e2eaa000-0000-4000-8000-${String(testInfo.workerIndex).padStart(12, '0')}`,
      externalId: `e2e-history-auth-${testInfo.workerIndex}`,
      title: `E2E History Auth ${testInfo.workerIndex}`,
    }
    await seedUserFavorite(fixture)
    try {
      await page.route('**/image/e2e-history-auth-*/**', (route) =>
        route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
      )
      // hovering the row intent-preloads the detail route, whose loader
      // would ask the provider for an asset that only exists as a seeded
      // snapshot; the preload is tolerated when it fails, so drop it
      await page.route('**/api/v1/asset/nasa_ivl/e2e-history-auth-*', (route) =>
        route.abort(),
      )
      await page.goto('/favorites')
      const row = page.getByRole('row', { name: fixture.title })
      await expect(row.getByRole('button', { name: 'Star' })).toBeEnabled()

      // the server loses the session while the client still holds one: the
      // route guard passes but the mutation comes back AUTH_REQUIRED, and
      // the modal must own its pushed entry instead of leaving a dialogless
      // one behind. Replays a recorded server-fn error response in Start's
      // framed wire format (the wire keeps only the error's message);
      // re-record via a cookie-cleared unfavorite if the protocol changes.
      const serial =
        '{"t":10,"i":0,"p":{"k":["result","error","context"],"v":[{"t":2,"s":1},{"t":25,"i":1,"s":{"message":{"t":1,"s":"AUTH_REQUIRED"}},"c":"$TSR/Error"},{"t":10,"i":2,"p":{"k":[],"v":[]},"o":0}]},"o":0}'
      const payload = Buffer.from(serial, 'utf8')
      const frameHeader = Buffer.alloc(9)
      frameHeader.writeUInt8(0, 0) // JSON frame, stream id 0
      frameHeader.writeUInt32BE(payload.length, 5)
      await page.route('**/_serverFn/**', (route) => {
        if (route.request().method() !== 'POST') {
          return route.fallback()
        }
        return route.fulfill({
          status: 200,
          headers: {
            'content-type': 'application/x-tss-framed; v=1',
            'x-tss-serialized': 'true',
          },
          body: Buffer.concat([frameHeader, payload]),
        })
      })
      await row.hover()
      const lengthBefore = await page.evaluate(() => history.length)
      await row.getByRole('button', { name: 'Star' }).click()

      await expect(page.getByRole('dialog')).toBeVisible()
      // the modal lives in history state, never the URL
      expect(await page.evaluate(() => location.search)).toBe('')
      expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

      await page
        .getByRole('button', { name: 'Close Log In or Register dialog' })
        .click()
      await expect(page.getByRole('dialog')).toBeHidden()
      expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)
      expect(await page.evaluate(() => location.pathname)).toBe('/favorites')
    } finally {
      await deleteUserFavorite(fixture)
    }
  },
)

test('a password update with a destination replaces the spent form in history', async ({
  page,
}, testInfo) => {
  test.slow()
  const email = `e2e-history-password-${testInfo.workerIndex}@example.com`
  const password = 'the-original-passphrase'
  await deleteUserByEmail(email)
  await createPasswordProbeUser(email, password, 'History Password Probe')
  try {
    await page.goto(
      '/login?next=%2Fauth%2Fupdate-password%3Fnext%3D%252Ffavorites',
    )
    await page.getByRole('textbox', { name: 'Email' }).fill(email)
    await page.getByRole('textbox', { name: 'Password' }).fill(password)
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/auth/update-password'),
      page.getByRole('button', { name: 'Log In' }).click(),
    ])
    // the user menu renders only after hydration resolves the session, so
    // it gates the fill past RAC's value-wiping first commit
    await expect(page.getByRole('button', { name: 'User Menu' })).toBeVisible()
    await page
      .getByRole('textbox', { name: 'Password' })
      .fill('the-replacement-passphrase')
    await page.getByRole('button', { name: 'Update' }).click()

    await page.waitForURL((url) => url.pathname === '/favorites')
    await expect(
      page.getByRole('alertdialog', { name: 'Password updated' }),
    ).toBeVisible()

    await page.goBack()
    await expect(page).not.toHaveURL(/update-password/)
  } finally {
    await deleteUserByEmail(email)
  }
})
