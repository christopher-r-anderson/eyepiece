import { expect, test } from './fixtures'

// The mutation forms post natively to their server-fn action URLs before
// hydration; these journeys run with JavaScript off entirely, so every
// assertion is about real document POSTs and their 303 redirects.
test.use({ javaScriptEnabled: false })

test('a no-JS login failure returns to the form with the error', async ({
  page,
}) => {
  await page.goto('/login?next=%2Ffavorites')
  await page.getByRole('textbox', { name: 'Email' }).fill('user1@example.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('wrong-password')
  await page.getByRole('button', { name: 'Log In' }).click()

  await page.waitForURL((url) => url.searchParams.has('formError'))
  await expect(page.getByText('Invalid login credentials')).toBeVisible()
  // the next target survives the round trip
  expect(new URL(page.url()).searchParams.get('next')).toBe('/favorites')
})

test('a no-JS login succeeds and honors next', async ({ page }) => {
  await page.goto('/login?next=%2Ffavorites')
  await page.getByRole('textbox', { name: 'Email' }).fill('user1@example.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('hunter2')
  await page.getByRole('button', { name: 'Log In' }).click()

  await page.waitForURL('/favorites')
  // the session rode the redirect: the private page rendered, not /login
  await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible()
})

test('a no-JS profile update round-trips with a status', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email' }).fill('user1@example.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('hunter2')
  await page.getByRole('button', { name: 'Log In' }).click()
  await page.waitForURL('/')

  await page.goto('/settings/profile')
  const displayName = page.getByRole('textbox', {
    name: 'Display Name (shown publicly)',
  })
  // resubmitting the existing name keeps the journey idempotent under
  // parallel workers while still exercising the real upsert
  await expect(displayName).not.toHaveValue('')
  await page.getByRole('button', { name: 'Update' }).click()

  await page.waitForURL((url) => url.searchParams.get('status') === 'updated')
  await expect(page.getByText('Profile Updated.')).toBeVisible()
})

test('a no-JS forgot-password submit lands on the sent panel', async ({
  page,
}) => {
  await page.goto('/auth/forgot-password')
  await page.getByRole('textbox', { name: 'Email' }).fill('user1@example.com')
  await page.getByRole('button', { name: 'Reset Password' }).click()

  await page.waitForURL((url) => url.searchParams.get('status') === 'sent')
  await expect(page.getByText('Password reset sent!')).toBeVisible()
})
