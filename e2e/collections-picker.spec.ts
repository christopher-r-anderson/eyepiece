import { randomUUID } from 'node:crypto'
import { expect, test } from './fixtures'
import {
  COLLECTIONS_FIXTURE,
  makeAdminClient,
  pagingSnapshot,
} from './support/collections-fixture'
import type { Page } from '@playwright/test'

const { publicCollection, user } = COLLECTIONS_FIXTURE

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

async function stubImages(page: Page) {
  await page.route('**/image/e2e-collections-*/**', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )
}

async function logIn(page: Page, next: string) {
  await stubImages(page)
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password)
  await Promise.all([
    page.waitForURL(next),
    page.getByRole('button', { name: 'Log In' }).click(),
  ])
}

// the veil's controls are hit-testable only while hover-revealed, and the
// reveal races an atomic move-and-click - hover first, then click
async function openTilePicker(page: Page, rowIndex: number) {
  const row = page.getByRole('grid').getByRole('row').nth(rowIndex)
  await row.hover()
  await row.getByRole('button', { name: 'Add to collection' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

test('logged out, the picker control prompts a login instead', async ({
  page,
}) => {
  await stubImages(page)
  await page.goto(`/collections/${publicCollection.id}`)
  // hydration gate: the enabled star means client state has settled
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()
  const row = page.getByRole('grid').getByRole('row').first()
  await row.hover()
  await row.getByRole('button', { name: 'Add to collection' }).click()
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Log In' }).first(),
  ).toBeVisible()
})

test('picker toggles membership and creates inline, staying open', async ({
  page,
}) => {
  const name = `e2e picker ${randomUUID().slice(0, 8)}`
  const admin = makeAdminClient()
  const collectionId = randomUUID()
  const { error } = await admin.from('collections').insert({
    id: collectionId,
    owner_id: user.id,
    name,
    visibility: 'private',
    position: 91,
  })
  if (error) {
    throw new Error(`Failed to seed picker collection: ${error.message}`)
  }
  const createdName = `e2e picker created ${randomUUID().slice(0, 8)}`
  try {
    await logIn(page, `/collections/${publicCollection.id}`)
    await expect(
      page.getByRole('button', { name: 'Star' }).first(),
    ).toBeEnabled()

    await openTilePicker(page, 0)
    const dialog = page.getByRole('dialog')
    const checkbox = dialog.getByRole('checkbox', { name })
    // the checkbox input is visually hidden; its label is the click target
    const checkboxLabel = dialog.locator('label', { hasText: name })
    await expect(checkbox).not.toBeChecked()

    // add: immediate commit, toast, popover stays open
    await checkboxLabel.click()
    // generous timeouts: these wait on a full mutation round trip, which
    // can stretch under full-suite worker load
    await expect(page.getByText(`Added to ${name}`)).toBeVisible({
      timeout: 15_000,
    })
    await expect(checkbox).toBeChecked({ timeout: 15_000 })
    await expect(dialog).toBeVisible()

    // remove: the unchecking checkbox is the feedback
    await checkboxLabel.click()
    await expect(checkbox).not.toBeChecked({ timeout: 15_000 })

    // inline create expands in place and adds in one step
    await dialog.getByRole('button', { name: 'New collection' }).click()
    await dialog.getByRole('textbox', { name: 'Name' }).fill(createdName)
    await dialog.getByRole('button', { name: 'Create and add' }).click()
    await expect(page.getByText(`Added to ${createdName}`)).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      dialog.getByRole('checkbox', { name: createdName }),
    ).toBeChecked({ timeout: 15_000 })
  } finally {
    await admin.from('collections').delete().eq('id', collectionId)
    await admin
      .from('collections')
      .delete()
      .eq('owner_id', user.id)
      .eq('name', createdName)
  }
})

test('unchecking the host collection keeps the picker and its tile in place', async ({
  page,
}, testInfo) => {
  const admin = makeAdminClient()
  const name = `e2e picker host ${randomUUID().slice(0, 8)}`
  const collectionId = randomUUID()
  // a spec-owned public collection with its own items, so unchecking the
  // host never disturbs the shared fixture collections
  const offset =
    { chromium: 6, firefox: 8, webkit: 10 }[testInfo.project.name] ?? 12
  const items = [pagingSnapshot(offset), pagingSnapshot(offset + 1)]
  const { error: collectionError } = await admin.from('collections').insert({
    id: collectionId,
    owner_id: user.id,
    name,
    visibility: 'public',
    position: 92,
  })
  if (collectionError) {
    throw new Error(
      `Failed to seed host collection: ${collectionError.message}`,
    )
  }
  const { error: itemsError } = await admin.from('collection_items').insert(
    items.map((snapshot, index) => ({
      collection_id: collectionId,
      asset_preview_snapshot_id: snapshot.id,
      position: index + 1,
    })),
  )
  if (itemsError) {
    throw new Error(`Failed to seed host items: ${itemsError.message}`)
  }
  try {
    await logIn(page, `/collections/${collectionId}`)
    await expect(
      page.getByRole('button', { name: 'Star' }).first(),
    ).toBeEnabled()

    const targetRow = page
      .getByRole('grid')
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: items[0].title }) })
    await targetRow.hover()
    await targetRow.getByRole('button', { name: 'Add to collection' }).click()
    const dialog = page.getByRole('dialog')
    const hostCheckbox = dialog.getByRole('checkbox', { name })
    await expect(hostCheckbox).toBeChecked()

    // unchecking the collection the tile lives in must not refetch the
    // grid out from under the anchored popover. The unchecked box proves
    // the mutation settled; the settle window then gives a wrongly-issued
    // grid refetch time to land before asserting nothing collapsed
    await dialog.locator('label', { hasText: name }).click()
    await expect(hostCheckbox).not.toBeChecked({ timeout: 15_000 })
    await page.waitForTimeout(3000)
    await expect(dialog).toBeVisible()
    await expect(
      page.getByRole('link', { name: items[0].title }),
    ).toBeVisible()
  } finally {
    await admin.from('collections').delete().eq('id', collectionId)
  }
})

test('favorites tiles unstar into ghosts with undo; removal sticks on reload', async ({
  page,
}, testInfo) => {
  const admin = makeAdminClient()
  // per-browser disjoint rows: the three projects run this spec in
  // parallel against the same fixture user, so they must not share
  // favorites (assertions count rows and the cleanup deletes them)
  const offset =
    { chromium: 0, firefox: 2, webkit: 4 }[testInfo.project.name] ?? 6
  const seeded = [pagingSnapshot(offset), pagingSnapshot(offset + 1)]
  const { error } = await admin.from('favorites').upsert(
    seeded.map((snapshot) => ({
      owner_id: user.id,
      asset_preview_snapshot_id: snapshot.id,
    })),
  )
  if (error) {
    throw new Error(`Failed to seed favorites: ${error.message}`)
  }
  try {
    await logIn(page, '/favorites')
    // assertions scope to this project's own rows: the parallel browser
    // projects share the fixture user, so the page may show their rows too
    const targetTitle = seeded[0].title
    const siblingTitle = seeded[1].title
    const targetRow = page
      .getByRole('grid')
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: targetTitle }) })
    await expect(targetRow).toHaveCount(1)
    await expect(
      page.getByRole('button', { name: 'Star' }).first(),
    ).toBeEnabled()

    const nextServerPost = () =>
      page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().startsWith('http://localhost:8888'),
      )

    // unstar: the tile stays as a dimmed ghost in its slot
    await targetRow.hover()
    const unstarred = nextServerPost()
    await targetRow.getByRole('button', { name: 'Star' }).click()
    await expect(targetRow.getByText('Removed')).toBeVisible()
    await unstarred

    // undo restores in place
    const restored = nextServerPost()
    await targetRow.getByRole('button', { name: 'Undo' }).click()
    await expect(targetRow.getByText('Removed')).toHaveCount(0)
    await expect(targetRow.getByRole('button', { name: 'Star' })).toBeVisible()
    await restored

    // unstar again and let it stand: gone on the next visit
    await targetRow.hover()
    const unstarredAgain = nextServerPost()
    await targetRow.getByRole('button', { name: 'Star' }).click()
    await expect(targetRow.getByText('Removed')).toBeVisible()
    await unstarredAgain
    await expect
      .poll(async () => {
        const { count } = await admin
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .in(
            'asset_preview_snapshot_id',
            seeded.map((snapshot) => snapshot.id),
          )
        return count
      })
      .toBe(1)
    await page.reload()
    await expect(page.getByRole('link', { name: targetTitle })).toHaveCount(0)
    await expect(page.getByRole('link', { name: siblingTitle })).toBeVisible()
  } finally {
    await admin
      .from('favorites')
      .delete()
      .eq('owner_id', user.id)
      .in(
        'asset_preview_snapshot_id',
        seeded.map((snapshot) => snapshot.id),
      )
  }
})
