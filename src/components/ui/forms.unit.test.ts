import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Form, FormHeading, TextField } from './forms'

describe('Form', () => {
  it('blocks submission while pending and marks the form busy', () => {
    const onSubmit = vi.fn()
    render(
      createElement(Form, { 'aria-label': 'Test', isPending: true, onSubmit }),
    )

    const form = screen.getByRole('form', { name: 'Test' })
    expect(form.getAttribute('aria-busy')).toBe('true')
    // fireEvent returns false when the event default was prevented
    expect(fireEvent.submit(form)).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits normally when not pending', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(createElement(Form, { 'aria-label': 'Test', onSubmit }))

    const form = screen.getByRole('form', { name: 'Test' })
    expect(form.getAttribute('aria-busy')).toBeNull()
    fireEvent.submit(form)
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})

describe('FormHeading', () => {
  it('maps levels 1 and 2 to sizes, replacing the level class', () => {
    render(createElement(FormHeading, { level: 1 }, 'One'))
    render(createElement(FormHeading, { level: 2 }, 'Two'))

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.classList).toContain('heading--size_title-lg')
    expect(h1.classList).not.toContain('heading--level_1')

    const h2 = screen.getByRole('heading', { level: 2 })
    expect(h2.classList).toContain('heading--size_title-md')
    expect(h2.classList).not.toContain('heading--level_2')
  })

  it('keeps the level scale at level 3', () => {
    render(createElement(FormHeading, { level: 3 }, 'Three'))

    const h3 = screen.getByRole('heading', { level: 3 })
    expect(h3.classList).toContain('heading--level_3')
    expect([...h3.classList].join(' ')).not.toContain('heading--size_')
  })
})

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
