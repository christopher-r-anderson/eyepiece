import { expect, test } from './fixtures'

const DEFAULT_TITLE = 'eyepiece: NASA Media Explorer'

test('routes without a specific title get the default', async ({ page }) => {
  const response = await page.goto('/')

  // the default ships in the server HTML, not just after hydration
  expect(await response?.text()).toContain(`<title>${DEFAULT_TITLE}</title>`)
  await expect(page).toHaveTitle(DEFAULT_TITLE)

  await page.goto('/login')
  await expect(page).toHaveTitle(DEFAULT_TITLE)
})

test('routes with their own title override the default', async ({ page }) => {
  // no q, so nothing is prefetched during SSR and the test stays hermetic
  await page.goto('/search')

  await expect(page).toHaveTitle(`Search | ${DEFAULT_TITLE}`)
})
