import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthCommands } from './use-auth-commands'

const mockCreateUserSupabaseClient = vi.fn()

vi.mock('@/integrations/supabase/user', () => ({
  createUserSupabaseClient: () => mockCreateUserSupabaseClient(),
}))

function makeClientStub() {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      resend: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }
}

describe('useAuthCommands', () => {
  beforeEach(() => {
    mockCreateUserSupabaseClient.mockReset()
  })

  it('does not create the client during render', async () => {
    const client = makeClientStub()
    mockCreateUserSupabaseClient.mockReturnValue(client)

    const { result } = renderHook(() => useAuthCommands())

    expect(mockCreateUserSupabaseClient).not.toHaveBeenCalled()

    await result.current.commands.login({
      email: 'name@example.com',
      password: 'password',
    })

    expect(mockCreateUserSupabaseClient).toHaveBeenCalledTimes(1)
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'name@example.com',
      password: 'password',
    })
  })

  it('reuses a single client across command calls', async () => {
    const client = makeClientStub()
    mockCreateUserSupabaseClient.mockReturnValue(client)

    const { result } = renderHook(() => useAuthCommands())

    await result.current.commands.login({
      email: 'name@example.com',
      password: 'password',
    })
    await result.current.commands.logout()

    expect(mockCreateUserSupabaseClient).toHaveBeenCalledTimes(1)
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })
})
