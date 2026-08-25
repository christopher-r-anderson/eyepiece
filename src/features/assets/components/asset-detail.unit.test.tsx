import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AssetDetail } from './asset-detail'
import type { Asset } from '@/domain/asset/asset.schema'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'

const image = {
  width: 1280,
  height: 640,
  renditions: [
    {
      href: 'https://images-assets.nasa.gov/image/PIA14417/PIA14417~large.jpg',
      width: 1280,
      height: 640,
    },
    {
      href: 'https://images-assets.nasa.gov/image/PIA14417/PIA14417~small.jpg',
      width: 640,
      height: 320,
    },
  ],
} satisfies Asset['image']

function asset(overrides: Partial<Asset> = {}): Asset {
  return {
    key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'PIA14417' },
    title: 'Weighing in on the Dumbbell Nebula',
    image,
    ...overrides,
  }
}

describe('asset detail', () => {
  afterEach(() => {
    cleanup()
  })

  it('sizes a landscape by the column and the height share at its ratio', () => {
    render(
      <AssetDetail asset={asset()} titleLevel={1} heightModel="viewport" />,
    )

    expect(screen.getByRole('img').getAttribute('sizes')).toBe(
      '(max-width: 72rem) min(calc(100vw - 2rem), calc(max(45dvh, 100dvh - 19rem) * 2.0000)), min(70rem, calc(max(45dvh, 100dvh - 19rem) * 2.0000))',
    )
  })

  it('sizes a portrait to its height share, under the full column', () => {
    const portrait = {
      width: 640,
      height: 1280,
      renditions: [image.renditions[0]!],
    }
    render(
      <AssetDetail
        asset={asset({ image: portrait })}
        titleLevel={1}
        heightModel="viewport"
      />,
    )

    expect(screen.getByRole('img').getAttribute('sizes')).toBe(
      '(max-width: 72rem) min(calc(100vw - 2rem), calc(max(45dvh, 100dvh - 19rem) * 0.5000)), min(70rem, calc(max(45dvh, 100dvh - 19rem) * 0.5000))',
    )
  })

  it('keeps the provider ratio when rendition rounding is immaterial', () => {
    const roundedImage = {
      width: 4070,
      height: 2268,
      renditions: [
        {
          href: 'https://images-assets.nasa.gov/image/DSC07878/DSC07878~medium.jpg',
          width: 1280,
          height: 713,
        },
        {
          href: 'https://images-assets.nasa.gov/image/DSC07878/DSC07878~small.jpg',
          width: 640,
          height: 356,
        },
      ],
    }
    render(
      <AssetDetail
        asset={asset({ image: roundedImage })}
        titleLevel={1}
        heightModel="viewport"
      />,
    )
    const renderedImage = screen.getByRole('img')
    Object.defineProperties(renderedImage, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 640 },
      naturalHeight: { configurable: true, value: 356 },
    })

    fireEvent.load(renderedImage)

    expect(renderedImage.getAttribute('data-test-ratio-source')).toBe(
      'provider',
    )
    expect(renderedImage.style.getPropertyValue('--ar')).toBe('1.7945')
  })

  it('keeps an intrinsic ratio through immaterial candidate rounding', () => {
    render(
      <AssetDetail asset={asset()} titleLevel={1} heightModel="viewport" />,
    )
    const renderedImage = screen.getByRole('img')
    Object.defineProperties(renderedImage, {
      naturalWidth: { configurable: true, value: 17978 },
      naturalHeight: { configurable: true, value: 10000 },
    })

    fireEvent.load(renderedImage)

    expect(renderedImage.getAttribute('data-test-ratio-source')).toBe(
      'intrinsic',
    )
    expect(renderedImage.style.getPropertyValue('--ar')).toBe('1.7978')

    Object.defineProperties(renderedImage, {
      naturalWidth: { configurable: true, value: 17952 },
      naturalHeight: { configurable: true, value: 10000 },
    })
    fireEvent.load(renderedImage)

    expect(renderedImage.getAttribute('data-test-ratio-source')).toBe(
      'intrinsic',
    )
    expect(renderedImage.style.getPropertyValue('--ar')).toBe('1.7978')
  })

  it('returns to provider sizing when a later candidate confirms it', () => {
    render(
      <AssetDetail asset={asset()} titleLevel={1} heightModel="viewport" />,
    )
    const renderedImage = screen.getByRole('img')
    Object.defineProperties(renderedImage, {
      naturalWidth: { configurable: true, value: 3 },
      naturalHeight: { configurable: true, value: 2 },
    })

    fireEvent.load(renderedImage)

    expect(renderedImage.getAttribute('data-test-ratio-source')).toBe(
      'intrinsic',
    )
    expect(renderedImage.style.getPropertyValue('--ar')).toBe('1.5000')

    Object.defineProperties(renderedImage, {
      naturalWidth: { configurable: true, value: 2 },
      naturalHeight: { configurable: true, value: 1 },
    })
    fireEvent.load(renderedImage)

    expect(renderedImage.getAttribute('data-test-ratio-source')).toBe(
      'provider',
    )
    expect(renderedImage.style.getPropertyValue('--ar')).toBe('2.0000')
  })

  it('keeps the image node while a new asset starts loading', () => {
    const { rerender } = render(
      <AssetDetail asset={asset()} titleLevel={1} heightModel="viewport" />,
    )
    const firstImage = screen.getByRole('img')

    const nextImage = {
      ...image,
      renditions: image.renditions.map((rendition) => ({
        ...rendition,
        href: rendition.href.replace('PIA14417', 'PIA14418'),
      })),
    }
    rerender(
      <AssetDetail
        asset={asset({
          key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'PIA14418' },
          image: nextImage,
        })}
        titleLevel={1}
        heightModel="viewport"
      />,
    )

    expect(screen.getByRole('img')).toBe(firstImage)
  })

  it('does not apply the previous image ratio to a new source', () => {
    const { rerender } = render(
      <AssetDetail asset={asset()} titleLevel={1} heightModel="viewport" />,
    )
    const renderedImage = screen.getByRole('img')
    Object.defineProperties(renderedImage, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 640 },
      naturalHeight: { configurable: true, value: 1280 },
    })
    fireEvent.load(renderedImage)
    expect(renderedImage.style.getPropertyValue('--ar')).toBe('0.5000')

    const nextImage = {
      width: 900,
      height: 600,
      renditions: [
        {
          href: 'https://images-assets.nasa.gov/image/PIA14418/PIA14418~large.jpg',
          width: 900,
          height: 600,
        },
      ],
    }
    rerender(
      <AssetDetail
        asset={asset({
          key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'PIA14418' },
          image: nextImage,
        })}
        titleLevel={1}
        heightModel="viewport"
      />,
    )

    expect(screen.getByRole('img')).toBe(renderedImage)
    expect(renderedImage.getAttribute('data-test-ratio-source')).toBe(
      'provider',
    )
    expect(renderedImage.style.getPropertyValue('--ar')).toBe('1.5000')

    Object.defineProperties(renderedImage, {
      naturalWidth: { configurable: true, value: 600 },
      naturalHeight: { configurable: true, value: 800 },
    })
    fireEvent.load(renderedImage)

    expect(renderedImage.getAttribute('data-test-ratio-source')).toBe(
      'intrinsic',
    )
    expect(renderedImage.style.getPropertyValue('--ar')).toBe('0.7500')
  })

  it('keeps candidate sizing on provider dimensions after measuring the file', () => {
    render(
      <AssetDetail asset={asset()} titleLevel={1} heightModel="viewport" />,
    )
    const renderedImage = screen.getByRole('img')
    const sizes = renderedImage.getAttribute('sizes')
    Object.defineProperties(renderedImage, {
      naturalWidth: { configurable: true, value: 640 },
      naturalHeight: { configurable: true, value: 1280 },
    })

    fireEvent.load(renderedImage)

    expect(renderedImage.getAttribute('data-test-ratio-source')).toBe(
      'intrinsic',
    )
    expect(renderedImage.style.getPropertyValue('--ar')).toBe('0.5000')
    expect(renderedImage.getAttribute('sizes')).toBe(sizes)
  })

  it('renders the image ahead of the title and the prose under it', () => {
    const { container } = render(
      <AssetDetail
        asset={asset({ description: 'Messier 27 in infrared.' })}
        titleLevel={1}
        heightModel="viewport"
      />,
    )

    const rendered = Array.from(container.querySelectorAll('img, h1, p')).map(
      (element) => element.tagName,
    )
    expect(rendered).toEqual(['IMG', 'H1', 'P', 'P'])
    // the spec names an image from its figcaption; real screen readers do not
    expect(container.querySelector('figure, figcaption')).toBeNull()
  })

  it('credits the source and links the record when the provider gives one', () => {
    render(
      <AssetDetail
        asset={asset({ sourceUrl: 'https://images.nasa.gov/details/PIA14417' })}
        titleLevel={1}
        heightModel="viewport"
      />,
    )

    expect(screen.getByText(/NASA Image and Video Library/)).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'source record' }).getAttribute('href'),
    ).toBe('https://images.nasa.gov/details/PIA14417')
  })

  it('still credits the source when there is no record link', () => {
    render(
      <AssetDetail asset={asset()} titleLevel={1} heightModel="viewport" />,
    )

    expect(screen.getByText(/NASA Image and Video Library/)).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('describes the image with the provider alt text when there is one', () => {
    render(
      <AssetDetail
        asset={asset({ alt: 'A green nebula against a dense starfield.' })}
        titleLevel={1}
        heightModel="viewport"
      />,
    )

    expect(
      screen.getByAltText('A green nebula against a dense starfield.'),
    ).toBeTruthy()
  })

  it('falls back to the title so the image keeps a real alt attribute', () => {
    render(
      <AssetDetail asset={asset()} titleLevel={1} heightModel="viewport" />,
    )

    expect(
      screen.getByAltText('Weighing in on the Dumbbell Nebula'),
    ).toBeTruthy()
  })
})
