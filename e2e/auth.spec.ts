import { expect, test } from './fixtures'
import type { Page } from '@playwright/test'

// a slow auth response holds the form in its pending state long enough to
// interact mid-submission
function delayAuthTokenResponse(page: Page) {
  return page.route('**/auth/v1/token*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await route.fallback()
  })
}

test.describe('Pending auth forms', () => {
  test('Escape dismisses the auth modal while a login is pending', async ({
    page,
  }) => {
    await delayAuthTokenResponse(page)
    await page.goto('/?auth=login')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // the hidden forgot-password panel keeps its fields in the DOM, so
    // locators must scope to the login form
    const form = dialog.getByRole('form', { name: 'Log In' })
    await form.getByRole('textbox', { name: 'Email' }).fill('user1@example.com')
    await form.getByRole('textbox', { name: 'Password' }).fill('hunter2')

    // clicking parks focus on the button; the pending state (not a
    // disable) is what keeps it there so Escape still reaches the modal
    const submit = form.getByRole('button', { name: 'Log In' })
    await submit.click()
    // matches native disabled and aria-disabled alike, so the Escape
    // behavior below is what distinguishes the pending pattern
    await expect(submit).toBeDisabled()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('repeat Enter during a pending login submits once', async ({ page }) => {
    await delayAuthTokenResponse(page)
    let tokenRequests = 0
    page.on('request', (request) => {
      if (request.url().includes('/auth/v1/token')) {
        tokenRequests++
      }
    })
    await page.goto('/?auth=login')
    const dialog = page.getByRole('dialog')
    const form = dialog.getByRole('form', { name: 'Log In' })
    await form.getByRole('textbox', { name: 'Email' }).fill('user1@example.com')
    const password = form.getByRole('textbox', { name: 'Password' })
    await password.fill('hunter2')

    // Enter's implicit submit bypasses the pending button entirely; the
    // form-level guard is what keeps repeats from queueing
    await password.press('Enter')
    await expect(form.getByRole('button', { name: 'Log In' })).toBeDisabled()
    await password.press('Enter')
    await password.press('Enter')

    // the delayed login completes and dismisses the dialog
    await expect(dialog).toBeHidden({ timeout: 10000 })
    expect(tokenRequests).toBe(1)
  })
})

test.describe('Protected Routes', () => {
  test('unauthenticated user can not visit protected settings page', async ({
    page,
  }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/login/)
  })
  test(
    'authenticated user can visit protected settings page',
    { tag: '@user' },
    async ({ page }) => {
      await page.goto('/settings')
      await expect(page).not.toHaveURL(/login/)
    },
  )

  test('token callback handler responses are private no-store', async ({
    request,
  }) => {
    const invalidQueryResponse = await request.get('/auth/confirm', {
      maxRedirects: 0,
    })

    expect(invalidQueryResponse.status()).toBe(400)
    expect(invalidQueryResponse.headers()['cache-control']).toBe(
      'private, no-store',
    )

    const redirectResponse = await request.get(
      '/auth/confirm?token_hash=bad-token&type=email',
      {
        maxRedirects: 0,
      },
    )

    expect(redirectResponse.status()).toBe(303)
    expect(redirectResponse.headers()['cache-control']).toBe(
      'private, no-store',
    )
    expect(redirectResponse.headers().location).toContain('/auth/confirm-error')
  })
})
