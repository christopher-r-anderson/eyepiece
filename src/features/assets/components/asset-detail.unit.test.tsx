import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AssetDetail } from './asset-detail'
import type { Asset } from '@/domain/asset/asset.schema'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'

const image = {
  href: 'https://images-assets.nasa.gov/image/PIA14417/PIA14417~large.jpg',
  width: 1280,
  height: 640,
}

function asset(overrides: Partial<Asset> = {}): Asset {
  return {
    key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'PIA14417' },
    title: 'Weighing in on the Dumbbell Nebula',
    thumbnail: image,
    image,
    original: image,
    ...overrides,
  }
}

describe('asset detail', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the image ahead of the title and description', () => {
    const { container } = render(
      <AssetDetail
        asset={asset({ description: 'Messier 27 in infrared.' })}
        titleLevel={1}
      />,
    )

    const rendered = Array.from(container.querySelectorAll('img, h1, p')).map(
      (element) => element.tagName,
    )
    expect(rendered).toEqual(['IMG', 'H1', 'P'])
    // the settled markup is plain: a figure would name the image from its
    // caption in the spec but not in the screen readers we tested
    expect(container.querySelector('figure, figcaption')).toBeNull()
  })

  it('takes the heading level from the surface that renders it', () => {
    render(<AssetDetail asset={asset()} titleLevel={2} />)

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Weighing in on the Dumbbell Nebula',
      }),
    ).toBeTruthy()
  })

  it('describes the image with the provider alt text when there is one', () => {
    render(
      <AssetDetail
        asset={asset({ alt: 'A green nebula against a dense starfield.' })}
        titleLevel={1}
      />,
    )

    expect(
      screen.getByAltText('A green nebula against a dense starfield.'),
    ).toBeTruthy()
  })

  it('falls back to the title so the image keeps a real alt attribute', () => {
    render(<AssetDetail asset={asset()} titleLevel={1} />)

    expect(
      screen.getByAltText('Weighing in on the Dumbbell Nebula'),
    ).toBeTruthy()
  })

  it('omits the description paragraph when the record has none', () => {
    const { container } = render(<AssetDetail asset={asset()} titleLevel={1} />)

    expect(container.querySelector('p')).toBeNull()
  })
})
