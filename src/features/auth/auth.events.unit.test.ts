import { describe, expect, it, vi } from 'vitest'
import { onUserChange } from './auth.events'
import type { AuthChangeSession, AuthClient } from './auth.events'
import type { AuthChangeEvent } from '@supabase/supabase-js'

type AuthStateChangeListener = Parameters<
  AuthClient['auth']['onAuthStateChange']
>[0]

function setup() {
  let authChangeListener: AuthStateChangeListener | undefined

  const unsubscribe = vi.fn(() => {
    authChangeListener = undefined
  })

  const onAuthStateChange = vi.fn((callback: AuthStateChangeListener) => {
    authChangeListener = callback
    return {
      data: {
        subscription: {
          unsubscribe,
        },
      },
    }
  })

  const client: AuthClient = {
    auth: {
      onAuthStateChange,
    },
  }

  return {
    client,
    emit: (event: AuthChangeEvent, session: AuthChangeSession) => {
      authChangeListener?.(event, session)
    },
    unsubscribe,
    onAuthStateChange,
  }
}

function setupMulti() {
  const listeners: Array<AuthStateChangeListener> = []

  const onAuthStateChange = vi.fn((callback: AuthStateChangeListener) => {
    listeners.push(callback)
    return {
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    }
  })

  const client: AuthClient = {
    auth: { onAuthStateChange },
  }

  return {
    client,
    emitToAll: (event: AuthChangeEvent, session: AuthChangeSession) => {
      for (const l of [...listeners]) l(event, session)
    },
  }
}

describe('onUserChange', () => {
  it('subscribes using the provided supabase client', () => {
    const { client, onAuthStateChange } = setup()

    onUserChange(client, () => undefined)

    expect(onAuthStateChange).toHaveBeenCalledTimes(1)
  })

  it('ignores auth events that are not listened to', () => {
    const { client, emit } = setup()
    const callback = vi.fn()

    onUserChange(client, callback)

    emit('TOKEN_REFRESHED', {
      user: { id: 'u1', email: 'u1@example.com' },
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('emits user on SIGNED_IN', () => {
    const { client, emit } = setup()
    const callback = vi.fn()

    onUserChange(client, callback)

    emit('SIGNED_IN', {
      user: { id: 'u1', email: 'u1@example.com' },
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({
      id: 'u1',
      email: 'u1@example.com',
    })
  })

  it('emits user with undefined email when session user has no email', () => {
    const { client, emit } = setup()
    const callback = vi.fn()

    onUserChange(client, callback)

    emit('SIGNED_IN', { user: { id: 'u1' } })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ id: 'u1', email: undefined })
  })

  it('emits null on SIGNED_OUT when there is no user in session', () => {
    const { client, emit } = setup()
    const callback = vi.fn()

    onUserChange(client, callback)

    emit('SIGNED_IN', {
      user: { id: 'u1', email: 'u1@example.com' },
    })
    emit('SIGNED_OUT', null)

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith(null)
  })

  it('emits null on SIGNED_OUT when session has a null user', () => {
    const { client, emit } = setup()
    const callback = vi.fn()

    onUserChange(client, callback)

    emit('SIGNED_IN', { user: { id: 'u1', email: 'u1@example.com' } })
    emit('SIGNED_OUT', { user: null })

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith(null)
  })

  it('does not emit on SIGNED_OUT when no prior user state has been established', () => {
    const { client, emit } = setup()
    const callback = vi.fn()

    onUserChange(client, callback)

    emit('SIGNED_OUT', null)

    expect(callback).not.toHaveBeenCalled()
  })

  it('dedupes repeated listened events when id and email are unchanged', () => {
    const { client, emit } = setup()
    const callback = vi.fn()

    onUserChange(client, callback)

    emit('SIGNED_IN', {
      user: { id: 'u1', email: 'u1@example.com' },
    })
    emit('SIGNED_IN', {
      user: { id: 'u1', email: 'u1@example.com' },
    })
    emit('USER_UPDATED', {
      user: { id: 'u1', email: 'u1@example.com' },
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({
      id: 'u1',
      email: 'u1@example.com',
    })
  })

  it('emits again when listened events change tracked user id or email', () => {
    const { client, emit } = setup()
    const callback = vi.fn()

    onUserChange(client, callback)

    emit('SIGNED_IN', {
      user: { id: 'u1', email: 'u1@example.com' },
    })
    emit('USER_UPDATED', {
      user: { id: 'u1', email: 'new@example.com' },
    })

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenNthCalledWith(1, {
      id: 'u1',
      email: 'u1@example.com',
    })
    expect(callback).toHaveBeenNthCalledWith(2, {
      id: 'u1',
      email: 'new@example.com',
    })
  })

  it('emits user on USER_UPDATED as the first event with no prior SIGNED_IN', () => {
    const { client, emit } = setup()
    const callback = vi.fn()

    onUserChange(client, callback)

    emit('USER_UPDATED', { user: { id: 'u1', email: 'u1@example.com' } })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ id: 'u1', email: 'u1@example.com' })
  })

  it('returns cleanup function that unsubscribes from auth changes', () => {
    const { client, emit, unsubscribe } = setup()
    const callback = vi.fn()

    const cleanup = onUserChange(client, callback)

    emit('SIGNED_IN', {
      user: { id: 'u1', email: 'u1@example.com' },
    })
    cleanup()
    emit('USER_UPDATED', {
      user: { id: 'u1', email: 'new@example.com' },
    })

    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('notifies all active subscribers when an auth event fires', () => {
    const { client, emitToAll } = setupMulti()
    const cb1 = vi.fn()
    const cb2 = vi.fn()

    onUserChange(client, cb1)
    emitToAll('SIGNED_IN', { user: { id: 'u1', email: 'u1@example.com' } })
    onUserChange(client, cb2)
    emitToAll('SIGNED_IN', { user: { id: 'u2', email: 'u2@example.com' } })

    expect(cb1).toHaveBeenCalledTimes(2)
    expect(cb1).toHaveBeenNthCalledWith(1, {
      id: 'u1',
      email: 'u1@example.com',
    })
    expect(cb1).toHaveBeenNthCalledWith(2, {
      id: 'u2',
      email: 'u2@example.com',
    })
    expect(cb2).toHaveBeenCalledTimes(1)
    expect(cb2).toHaveBeenCalledWith({ id: 'u2', email: 'u2@example.com' })
  })
})
