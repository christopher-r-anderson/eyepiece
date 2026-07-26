import { expect, test } from './fixtures'

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
