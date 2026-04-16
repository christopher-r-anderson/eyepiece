import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextField } from './forms'

describe('TextField', () => {
  it('toggles password visibility from the shared visibility button', () => {
    render(
      createElement(TextField, {
        label: 'Password',
        name: 'password',
        type: 'password',
      }),
    )

    const input = screen.getByLabelText('Password')
    const toggle = screen.getByRole('button', {
      name: 'Toggle password visibility',
    })

    expect(input.getAttribute('type')).toBe('password')

    fireEvent.click(toggle)
    expect(input.getAttribute('type')).toBe('text')

    fireEvent.click(toggle)
    expect(input.getAttribute('type')).toBe('password')
  })
})
