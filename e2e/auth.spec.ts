import { expect, test } from './fixtures'

test.describe('Pending auth forms', () => {
  test('Escape dismisses the auth modal while a login is pending', async ({
    page,
  }) => {
    // the login must never resolve: a completed login closes the modal on
    // its own, which would mask a dead Escape
    await page.route('**/auth/v1/token*', () => new Promise(() => {}))
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

  // the reset panel's single text field is the implicit-submit hazard: with
  // the pending submit button out of play, Enter submits the form directly
  // and React would queue each one into a repeat action without the form
  // guard (multi-field forms like login get no implicit submit at all)
  test('repeat Enter during a pending reset submits once', async ({ page }) => {
    let recoverRequests = 0
    await page.route('**/auth/v1/recover*', async (route) => {
      recoverRequests++
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await route.fulfill({ json: {} })
    })
    await page.goto('/?auth=login&fp=1')
    const dialog = page.getByRole('dialog')
    const form = dialog.getByRole('form', { name: 'Reset Password' })
    const email = form.getByRole('textbox', { name: 'Email' })
    await email.fill('user1@example.com')

    await email.press('Enter')
    await expect(
      form.getByRole('button', { name: 'Reset Password' }),
    ).toBeDisabled()
    // spaced presses land in separate renders of the pending window -
    // rapid ones coalesce and would pass even without the guard; the
    // trailing wait is the window where queued repeats fire their
    // requests after the first action settles (probed: 3 without the
    // guard, 1 with it)
    await page.waitForTimeout(500)
    await email.press('Enter')
    await page.waitForTimeout(500)
    await email.press('Enter')
    await page.waitForTimeout(3000)

    // the stubbed reset completes and swaps in the sent confirmation
    await expect(dialog.getByText('Password reset sent!')).toBeVisible({
      timeout: 10000,
    })
    expect(recoverRequests).toBe(1)
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
