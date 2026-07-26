import { expect, test } from './fixtures'
import {
  COLLECTIONS_FIXTURE,
  makeAdminClient,
} from './support/collections-fixture'
import type { Page } from '@playwright/test'

const { publicCollection, privateCollection, pagingCollection, user } =
  COLLECTIONS_FIXTURE

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

async function logInToCollections(page: Page) {
  await page.route('**/image/e2e-collections-*/**', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )
  // the app's next= redirect avoids a post-login goto that automated
  // firefox aborts
  await page.goto('/login?next=%2Fcollections')
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password)
  await Promise.all([
    page.waitForURL('/collections'),
    page.getByRole('button', { name: 'Log In' }).click(),
  ])
}

test('list page shows every owned collection; only public cards link out', async ({
  page,
}) => {
  await logInToCollections(page)

  await expect(
    page.getByRole('heading', { level: 1, name: 'Your collections' }),
  ).toBeVisible()

  await expect(page.getByText(`3 items · public`)).toBeVisible()
  await expect(
    page.getByRole('link', { name: publicCollection.name }),
  ).toHaveAttribute('href', `/collections/${publicCollection.id}`)

  // a private collection has no public destination, so its card is static
  await expect(page.getByText(privateCollection.name)).toBeVisible()
  await expect(page.getByText(`0 items · private`)).toBeVisible()
  await expect(
    page.getByRole('link', { name: privateCollection.name }),
  ).toHaveCount(0)

  await expect(page.getByText(`60 items · public`)).toBeVisible()
  await expect(
    page.getByRole('link', { name: pagingCollection.name }),
  ).toBeVisible()
})

test('create flow: dialog on #new, private by default, list updates, back stays closed', async ({
  page,
}) => {
  const createdName = `e2e created ${Date.now()}`
  try {
    await logInToCollections(page)

    await page.getByRole('button', { name: 'New collection' }).click()
    await expect(page).toHaveURL('/collections#new')
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('heading', { name: 'New collection' }),
    ).toBeVisible()

    await dialog.getByRole('textbox', { name: 'Name' }).fill(createdName)
    await dialog.getByRole('button', { name: 'Create' }).click()

    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL('/collections')
    // the visibility switch was left off, so the new card reads private
    // and stays a static (linkless) card
    const createdCard = page
      .getByRole('listitem')
      .filter({ hasText: createdName })
    await expect(createdCard.getByText('0 items · private')).toBeVisible()
    await expect(createdCard.getByRole('link')).toHaveCount(0)

    // closing by success popped the pushed dialog entry, so going back
    // must not resurface the dialog
    await page.goBack()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  } finally {
    await makeAdminClient()
      .from('collections')
      .delete()
      .eq('owner_id', user.id)
      .eq('name', createdName)
  }
})

test('create dialog validates emptied names and Escape leaves no hash behind', async ({
  page,
}) => {
  await logInToCollections(page)

  await page.getByRole('button', { name: 'New collection' }).click()
  const dialog = page.getByRole('dialog')
  const nameField = dialog.getByRole('textbox', { name: 'Name' })
  await expect(nameField).toBeVisible()

  // whitespace passes native isRequired but fails the trimmed schema on
  // the action, so the error must come back into the still-open dialog
  await nameField.fill('   ')
  await dialog.getByRole('button', { name: 'Create' }).click()
  await expect(dialog.locator('[slot="errorMessage"]')).toBeVisible()

  // re-enter the field before Escape: the submit's pending flicker disables
  // the Create button, which can park focus on body until the focus scope
  // restores it - an Escape in that window lands outside the overlay
  await nameField.click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL('/collections')
})

test(
  'user menu reaches the collections list',
  { tag: '@user' },
  async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'User Menu' }).click()
    await page.getByRole('menuitem', { name: 'Your Collections' }).click()
    await page.waitForURL('/collections')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your collections' }),
    ).toBeVisible()
  },
)
