import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createTypedAction } from './forms.hooks'
import { Err, Ok } from '@/lib/result'

describe('createTypedAction', () => {
  it('preserves handled action error code and field errors', async () => {
    const schema = z.object({
      displayName: z.string().min(1),
    })
    const action = vi.fn().mockResolvedValue(
      Err({
        code: 'invalid_input',
        message: 'Invalid input',
        fieldErrors: {
          displayName: 'Display name must not be empty.',
        },
      }),
    )
    const [formAction, initialState] = createTypedAction(schema, action)
    const formData = new FormData()
    formData.set('displayName', 'existing name')

    const state = await formAction(initialState, formData)

    expect(state.status).toBe('action-error')
    expect(state.error).toBe('Invalid input')
    expect(state.code).toBe('invalid_input')
    expect(state.fieldErrors).toEqual({
      displayName: 'Display name must not be empty.',
    })
    if (state.status === 'action-error') {
      expect(state.data).toEqual({ displayName: 'existing name' })
    }
  })

  it('filters handled field errors to schema keys', async () => {
    const schema = z.object({
      displayName: z.string().min(1),
    })
    const action = vi.fn().mockResolvedValue(
      Err({
        code: 'invalid_input',
        message: 'Invalid input',
        fieldErrors: {
          displayName: 'Display name must not be empty.',
          staleField: 'This key should be ignored.',
        },
      }),
    )
    const [formAction, initialState] = createTypedAction(schema, action)
    const formData = new FormData()
    formData.set('displayName', 'existing name')

    const state = await formAction(initialState, formData)

    expect(state.status).toBe('action-error')
    expect(state.fieldErrors).toEqual({
      displayName: 'Display name must not be empty.',
    })
  })

  it('keeps message-only handled action errors working', async () => {
    const schema = z.object({
      email: z.email(),
    })
    const action = vi.fn().mockResolvedValue(
      Err({
        message: 'Invalid login credentials',
      }),
    )
    const [formAction, initialState] = createTypedAction(schema, action)
    const formData = new FormData()
    formData.set('email', 'user@example.com')

    const state = await formAction(initialState, formData)

    expect(state.status).toBe('action-error')
    expect(state.error).toBe('Invalid login credentials')
    expect(state.code).toBeUndefined()
    expect(state.fieldErrors).toBeUndefined()
  })

  it('returns success when the action succeeds', async () => {
    const schema = z.object({
      email: z.email(),
    })
    const action = vi.fn().mockResolvedValue(Ok(undefined))
    const [formAction, initialState] = createTypedAction(schema, action)
    const formData = new FormData()
    formData.set('email', 'user@example.com')

    const state = await formAction(initialState, formData)

    expect(state.status).toBe('success')
    expect(state.error).toBeUndefined()
    expect(state.code).toBeUndefined()
    expect(state.fieldErrors).toBeUndefined()
  })
})
