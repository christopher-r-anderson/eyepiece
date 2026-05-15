import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthCommandsProvider, useAuthCommands } from './auth.commands-provider'
import type { ReactNode } from 'react'
import { UserSupabaseClientProvider } from '@/integrations/supabase/providers/user-provider'

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

describe('AuthCommandsProvider', () => {
  beforeEach(() => {
    mockCreateUserSupabaseClient.mockReset()
  })

  it('does not create the browser client during render when no shared client is available', async () => {
    const browserClient = makeClientStub()
    mockCreateUserSupabaseClient.mockReturnValue(browserClient)

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthCommandsProvider>{children}</AuthCommandsProvider>
    )

    const { result } = renderHook(() => useAuthCommands(), { wrapper })

    expect(mockCreateUserSupabaseClient).not.toHaveBeenCalled()

    await result.current.commands.login({
      email: 'name@example.com',
      password: 'password',
    })

    expect(mockCreateUserSupabaseClient).toHaveBeenCalledTimes(1)
    expect(browserClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'name@example.com',
      password: 'password',
    })
  })

  it('reuses the shared user client when one is already provided', async () => {
    const sharedClient = makeClientStub()

    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserSupabaseClientProvider userSupabaseClient={sharedClient as any}>
        <AuthCommandsProvider>{children}</AuthCommandsProvider>
      </UserSupabaseClientProvider>
    )

    const { result } = renderHook(() => useAuthCommands(), { wrapper })

    await result.current.commands.logout()

    expect(mockCreateUserSupabaseClient).not.toHaveBeenCalled()
    expect(sharedClient.auth.signOut).toHaveBeenCalledWith({
      scope: 'local',
    })
  })
})
