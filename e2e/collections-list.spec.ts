import { expect, test } from './fixtures'
import {
  COLLECTIONS_FIXTURE,
  makeAdminClient,
} from './support/collections-fixture'
import { logInAsFixtureUser } from './support/collections-helpers'

const { publicCollection, privateCollection, pagingCollection, user } =
  COLLECTIONS_FIXTURE

test('list page shows every owned collection; cards link to manage pages', async ({
  page,
}) => {
  await logInAsFixtureUser(page, '/collections')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Your collections' }),
  ).toBeVisible()

  // meta texts scope to their card: parallel specs seed extra collections
  // for this shared user, so bare text lookups can multi-match
  const cardFor = (collectionName: string) =>
    page.getByRole('listitem').filter({ hasText: collectionName })
  await expect(
    cardFor(publicCollection.name).getByText('3 items · public'),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: publicCollection.name }),
  ).toHaveAttribute('href', `/collections/${publicCollection.id}/manage`)

  // private collections are manageable too - the owner surface links them
  // even though the public detail stays not-found
  await expect(
    cardFor(privateCollection.name).getByText('0 items · private'),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: privateCollection.name }),
  ).toHaveAttribute('href', `/collections/${privateCollection.id}/manage`)

  await expect(
    cardFor(pagingCollection.name).getByText('60 items · public'),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: pagingCollection.name }),
  ).toBeVisible()
})

test('create flow: dialog on #new, private by default, list updates, back stays closed', async ({
  page,
}) => {
  const createdName = `e2e created ${Date.now()}`
  try {
    await logInAsFixtureUser(page, '/collections')

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
    // and links to its manage page
    const createdCard = page
      .getByRole('listitem')
      .filter({ hasText: createdName })
    await expect(createdCard.getByText('0 items · private')).toBeVisible()
    await expect(createdCard.getByRole('link')).toHaveAttribute(
      'href',
      /\/collections\/.+\/manage$/,
    )

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
  await logInAsFixtureUser(page, '/collections')

  await page.getByRole('button', { name: 'New collection' }).click()
  const dialog = page.getByRole('dialog')
  const nameField = dialog.getByRole('textbox', { name: 'Name' })
  await expect(nameField).toBeVisible()

  // whitespace passes native isRequired but fails the trimmed schema on
  // the action, so the error must come back into the still-open dialog
  await nameField.fill('   ')
  await dialog.getByRole('button', { name: 'Create' }).click()
  await expect(dialog.locator('[slot="errorMessage"]')).toBeVisible()

  // no refocus first: this pins that the pending submit keeps focus inside
  // the dialog (a disabled-while-pending button strands focus on body and
  // this Escape goes dead)
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
