import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Select } from './select'

type Provider = {
  id: string
  label: string
}

const PROVIDERS = [
  { id: 'nasa', label: 'NASA' },
  { id: 'si', label: 'SI' },
]

function getProviderId(item: object) {
  return (item as Provider).id
}

function getProviderLabel(item: object) {
  return (item as Provider).label
}

describe('Select', () => {
  it('renders the selected item text in the server placeholder when value is provided', () => {
    render(
      createElement(Select, {
        serverOnly: true,
        items: PROVIDERS,
        value: 'si',
        getItemId: getProviderId,
        getItemText: getProviderLabel,
      }),
    )

    expect(screen.getByText('SI')).toBeTruthy()
  })

  it('renders the placeholder in the server placeholder when no value is selected', () => {
    render(
      createElement(Select, {
        serverOnly: true,
        items: PROVIDERS,
        placeholder: 'Choose a provider',
        getItemId: getProviderId,
        getItemText: getProviderLabel,
      }),
    )

    expect(screen.getByText('Choose a provider')).toBeTruthy()
  })
})
