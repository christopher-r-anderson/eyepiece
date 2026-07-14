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
  it('renders the selected item text when a value is provided', () => {
    render(
      createElement(Select, {
        'aria-label': 'Provider',
        items: PROVIDERS,
        value: 'si',
        getItemId: getProviderId,
        getItemText: getProviderLabel,
      }),
    )

    expect(screen.getByRole('button', { name: /SI/ })).toBeTruthy()
  })

  it('renders the placeholder when no value is selected', () => {
    render(
      createElement(Select, {
        'aria-label': 'Provider',
        items: PROVIDERS,
        placeholder: 'Choose a provider',
        getItemId: getProviderId,
        getItemText: getProviderLabel,
      }),
    )

    expect(screen.getByText('Choose a provider')).toBeTruthy()
  })
})
