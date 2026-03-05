import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthChangeEvent } from '@supabase/supabase-js'

type SessionLike = {
  user?: {
    id: string
    email?: string | null
  } | null
} | null

async function setup() {
  vi.resetModules()

  let authChangeListener:
    | ((event: AuthChangeEvent, session: SessionLike) => void)
    | undefined

  const unsubscribe = vi.fn(() => {
    authChangeListener = undefined
  })

  const onAuthStateChange = vi.fn(
    (callback: (event: AuthChangeEvent, session: SessionLike) => void) => {
      authChangeListener = callback
      return {
        data: {
          subscription: {
            unsubscribe,
          },
        },
      }
    },
  )

  const createUserSupabaseBrowserClient = vi.fn(() => ({
    auth: {
      onAuthStateChange,
    },
  }))

  vi.doMock('@/integrations/supabase/user/browser.client', () => ({
    createUserSupabaseBrowserClient,
  }))

  const { onUserChange } = await import('./auth.events')

  return {
    onUserChange,
    emit: (event: AuthChangeEvent, session: SessionLike) => {
      authChangeListener?.(event, session)
    },
    unsubscribe,
    onAuthStateChange,
    createUserSupabaseBrowserClient,
  }
}

async function setupMulti() {
  vi.resetModules()

  const listeners: Array<
    (event: AuthChangeEvent, session: SessionLike) => void
  > = []

  const onAuthStateChange = vi.fn(
    (callback: (event: AuthChangeEvent, session: SessionLike) => void) => {
      listeners.push(callback)
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }
    },
  )

  vi.doMock('@/integrations/supabase/user/browser.client', () => ({
    createUserSupabaseBrowserClient: vi.fn(() => ({
      auth: { onAuthStateChange },
    })),
  }))

  const { onUserChange } = await import('./auth.events')

  return {
    onUserChange,
    emitToAll: (event: AuthChangeEvent, session: SessionLike) => {
      for (const l of [...listeners]) l(event, session)
    },
  }
}

describe('onUserChange', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('subscribes using the browser supabase client', async () => {
    const { onUserChange, onAuthStateChange, createUserSupabaseBrowserClient } =
      await setup()

    onUserChange(() => undefined)

    expect(createUserSupabaseBrowserClient).toHaveBeenCalledTimes(1)
    expect(onAuthStateChange).toHaveBeenCalledTimes(1)
  })

  it('ignores auth events that are not listened to', async () => {
    const { onUserChange, emit } = await setup()
    const callback = vi.fn()

    onUserChange(callback)

    emit('TOKEN_REFRESHED', {
      user: { id: 'u1', email: 'u1@example.com' },
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('emits user on SIGNED_IN', async () => {
    const { onUserChange, emit } = await setup()
    const callback = vi.fn()

    onUserChange(callback)

    emit('SIGNED_IN', {
      user: { id: 'u1', email: 'u1@example.com' },
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({
      id: 'u1',
      email: 'u1@example.com',
    })
  })

  it('emits user with undefined email when session user has no email', async () => {
    const { onUserChange, emit } = await setup()
    const callback = vi.fn()

    onUserChange(callback)

    emit('SIGNED_IN', { user: { id: 'u1' } })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ id: 'u1', email: undefined })
  })

  it('emits null on SIGNED_OUT when there is no user in session', async () => {
    const { onUserChange, emit } = await setup()
    const callback = vi.fn()

    onUserChange(callback)

    emit('SIGNED_IN', {
      user: { id: 'u1', email: 'u1@example.com' },
    })
    emit('SIGNED_OUT', null)

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith(null)
  })

  it('emits null on SIGNED_OUT when session has a null user', async () => {
    const { onUserChange, emit } = await setup()
    const callback = vi.fn()

    onUserChange(callback)

    emit('SIGNED_IN', { user: { id: 'u1', email: 'u1@example.com' } })
    emit('SIGNED_OUT', { user: null })

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith(null)
  })

  it('does not emit on SIGNED_OUT when no prior user state has been established', async () => {
    const { onUserChange, emit } = await setup()
    const callback = vi.fn()

    onUserChange(callback)

    emit('SIGNED_OUT', null)

    expect(callback).not.toHaveBeenCalled()
  })

  it('dedupes repeated listened events when id and email are unchanged', async () => {
    const { onUserChange, emit } = await setup()
    const callback = vi.fn()

    onUserChange(callback)

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

  it('emits again when listened events change tracked user id or email', async () => {
    const { onUserChange, emit } = await setup()
    const callback = vi.fn()

    onUserChange(callback)

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

  it('emits user on USER_UPDATED as the first event with no prior SIGNED_IN', async () => {
    const { onUserChange, emit } = await setup()
    const callback = vi.fn()

    onUserChange(callback)

    emit('USER_UPDATED', { user: { id: 'u1', email: 'u1@example.com' } })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ id: 'u1', email: 'u1@example.com' })
  })

  it('returns cleanup function that unsubscribes from auth changes', async () => {
    const { onUserChange, emit, unsubscribe } = await setup()
    const callback = vi.fn()

    const cleanup = onUserChange(callback)

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

  it('notifies all active subscribers when an auth event fires', async () => {
    const { onUserChange, emitToAll } = await setupMulti()
    const cb1 = vi.fn()
    const cb2 = vi.fn()

    onUserChange(cb1)
    emitToAll('SIGNED_IN', { user: { id: 'u1', email: 'u1@example.com' } })
    onUserChange(cb2)
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
