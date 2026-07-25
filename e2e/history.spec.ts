import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'

const { publicCollection, snapshots } = COLLECTIONS_FIXTURE
const wideSnapshot = snapshots[0]

// D13: closing a dialog never pushes history forward. An open pushed by the
// app is consumed with a real back(); a deep-linked open closes by replace.

test('closing the metadata dialog consumes its history entry', async ({
  page,
}) => {
  await page.goto(`/collections/${publicCollection.id}`)
  // enabled star = hydrated (tile links work pre-hydration, dialogs do not)
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()
  await page.getByRole('link', { name: wideSnapshot.title }).click()
  await page.waitForURL(`/assets/nasa_ivl/${wideSnapshot.externalId}`)
  // the detail page has replaced the grid once its own controls exist;
  // its single enabled star is then the hydration gate
  await expect(
    page.getByRole('button', { name: 'View metadata' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Star' })).toBeEnabled()

  const lengthBefore = await page.evaluate(() => history.length)
  await page.getByRole('button', { name: 'View metadata' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForFunction(() => location.hash === '#metadata')
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  await page.keyboard.press('Escape')
  await page.waitForFunction(() => location.hash === '')
  await expect(page.getByRole('dialog')).toBeHidden()
  // the close went back over the entry the open pushed - no forward growth
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  // and one more back skips the dialog entirely
  await page.goBack()
  await page.waitForURL(`/collections/${publicCollection.id}`)
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('a deep-linked metadata dialog closes in place', async ({ page }) => {
  await page.goto(`/assets/nasa_ivl/${wideSnapshot.externalId}#metadata`)
  await expect(page.getByRole('dialog')).toBeVisible()

  const lengthBefore = await page.evaluate(() => history.length)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => location.hash === '')
  await expect(page.getByRole('dialog')).toBeHidden()
  // nothing to go back over: the close replaced the deep-linked entry
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore)
  expect(await page.evaluate(() => location.pathname)).toBe(
    `/assets/nasa_ivl/${wideSnapshot.externalId}`,
  )
})

test('the auth dialog occupies one history entry from open to close', async ({
  page,
}) => {
  await page.goto(`/collections/${publicCollection.id}`)
  const tile = page.getByRole('listitem').first()
  await expect(tile.getByRole('button', { name: 'Star' })).toBeEnabled()
  // the veil must be revealed before its controls take the pointer
  await tile.hover()

  const lengthBefore = await page.evaluate(() => history.length)
  await tile.getByRole('button', { name: 'Star' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForFunction(() => location.search.includes('auth=login'))
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  // switching tabs stays inside the same entry
  await page.getByRole('tab', { name: 'Register' }).click()
  await page.waitForFunction(() => location.search.includes('auth=register'))
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  await page
    .getByRole('button', { name: 'Close Log In or Register dialog' })
    .click()
  await page.waitForFunction(() => !location.search.includes('auth'))
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)
  expect(await page.evaluate(() => location.pathname)).toBe(
    `/collections/${publicCollection.id}`,
  )
})
