import { expect, test } from './fixtures'

const NASA_PROVIDER_ID = 'nasa_ivl'

function stubAsset(index: number) {
  const externalId = `stub-asset-${index}`
  const image = {
    href: `https://images-assets.nasa.gov/image/${externalId}/${externalId}~thumb.jpg`,
    width: 640,
    height: 480,
  }
  return {
    key: { providerId: NASA_PROVIDER_ID, externalId },
    title: `Stub Asset ${index}`,
    thumbnail: image,
    description: `Stub asset ${index} description`,
    image,
    original: image,
  }
}

const stubSearchResponse = {
  items: Array.from({ length: 12 }, (_, index) => stubAsset(index)),
  pagination: { next: null, total: 12 },
}

test('virtualized grid re-flows its columns when the viewport resizes', async ({
  page,
}) => {
  await page.route('**/api/v1/search*', (route) =>
    route.fulfill({ json: stubSearchResponse }),
  )
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto(`/search?q=moon&providerId=${NASA_PROVIDER_ID}`)

  const firstRow = page.locator('[data-index="0"]').first()
  await expect(firstRow).toBeVisible()

  const countColumns = () =>
    firstRow.evaluate(
      (row) => getComputedStyle(row).gridTemplateColumns.split(' ').length,
    )

  const wideColumns = await countColumns()
  expect(wideColumns).toBeGreaterThanOrEqual(4)

  await page.setViewportSize({ width: 700, height: 900 })
  await expect(async () => {
    expect(await countColumns()).toBeLessThanOrEqual(3)
  }).toPass()

  await page.setViewportSize({ width: 1400, height: 900 })
  await expect(async () => {
    expect(await countColumns()).toBe(wideColumns)
  }).toPass()
})
