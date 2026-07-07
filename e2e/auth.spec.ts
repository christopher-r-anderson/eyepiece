import { expect, test } from './fixtures'

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
