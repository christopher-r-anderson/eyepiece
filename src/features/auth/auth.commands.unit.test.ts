import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAuthCommands } from './auth.commands'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// Minimal auth related stub for Supabase client
function makeClientStub() {
  return {
    auth: {
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      signUp: vi.fn(),
      resend: vi.fn(),
      updateUser: vi.fn(),
    },
  }
}

// Convenience: resolve with no error (success)
const successResponse = { error: null }
// Convenience: resolve with a Supabase-shaped error
function errorResponse(message: string) {
  return { error: { message } }
}

describe('makeAuthCommands', () => {
  let client: ReturnType<typeof makeClientStub>
  let commands: ReturnType<typeof makeAuthCommands>

  beforeEach(() => {
    client = makeClientStub()
    commands = makeAuthCommands(client as any)
  })

  describe('login', () => {
    it('calls signInWithPassword with the provided credentials', async () => {
      client.auth.signInWithPassword.mockResolvedValue(successResponse)

      await commands.login({ email: 'user@example.com', password: 'secret' })

      expect(client.auth.signInWithPassword).toHaveBeenCalledOnce()
      expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret',
      })
    })

    it('returns Ok on success', async () => {
      client.auth.signInWithPassword.mockResolvedValue(successResponse)

      const result = await commands.login({
        email: 'user@example.com',
        password: 'secret',
      })

      expect(resultIsSuccess(result)).toBe(true)
    })

    it('returns Err with the mapped error message on failure', async () => {
      client.auth.signInWithPassword.mockResolvedValue(
        errorResponse('Invalid login credentials'),
      )

      const result = await commands.login({
        email: 'user@example.com',
        password: 'wrong',
      })

      expect(resultIsError(result)).toBe(true)
      if (resultIsError(result)) {
        expect(result.error.message).toBe('Invalid login credentials')
      }
    })
  })

  describe('resetPassword', () => {
    it('calls resetPasswordForEmail with email and redirectTo', async () => {
      client.auth.resetPasswordForEmail.mockResolvedValue(successResponse)

      await commands.resetPassword({
        email: 'user@example.com',
        redirectTo: 'https://example.com/reset',
      })

      expect(client.auth.resetPasswordForEmail).toHaveBeenCalledOnce()
      expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        { redirectTo: 'https://example.com/reset' },
      )
    })

    it('returns Ok on success', async () => {
      client.auth.resetPasswordForEmail.mockResolvedValue(successResponse)

      const result = await commands.resetPassword({
        email: 'user@example.com',
        redirectTo: 'https://example.com/reset',
      })

      expect(resultIsSuccess(result)).toBe(true)
    })

    it('returns Err with the mapped error message on failure', async () => {
      client.auth.resetPasswordForEmail.mockResolvedValue(
        errorResponse('User not found'),
      )

      const result = await commands.resetPassword({
        email: 'unknown@example.com',
        redirectTo: 'https://example.com/reset',
      })

      expect(resultIsError(result)).toBe(true)
      if (resultIsError(result)) {
        expect(result.error.message).toBe('User not found')
      }
    })
  })

  describe('register', () => {
    const validInput = {
      email: 'new@example.com',
      displayName: 'New User',
      password: 'password123',
      redirectTo: 'https://example.com/confirm',
    }

    it('calls signUp with correct arguments including display_name in user metadata', async () => {
      client.auth.signUp.mockResolvedValue(successResponse)

      await commands.register(validInput)

      expect(client.auth.signUp).toHaveBeenCalledOnce()
      expect(client.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: { display_name: 'New User' },
          emailRedirectTo: 'https://example.com/confirm',
        },
      })
    })

    it('returns Ok on success', async () => {
      client.auth.signUp.mockResolvedValue(successResponse)

      const result = await commands.register(validInput)

      expect(resultIsSuccess(result)).toBe(true)
    })

    it('returns Err with the mapped error message on failure', async () => {
      client.auth.signUp.mockResolvedValue(
        errorResponse('Email already in use'),
      )

      const result = await commands.register(validInput)

      expect(resultIsError(result)).toBe(true)
      if (resultIsError(result)) {
        expect(result.error.message).toBe('Email already in use')
      }
    })
  })

  describe('resendRegisterConfirmation', () => {
    it('calls resend with email, type signup, and emailRedirectTo', async () => {
      client.auth.resend.mockResolvedValue(successResponse)

      await commands.resendRegisterConfirmation({
        email: 'user@example.com',
        redirectTo: 'https://example.com/confirm',
      })

      expect(client.auth.resend).toHaveBeenCalledOnce()
      expect(client.auth.resend).toHaveBeenCalledWith({
        email: 'user@example.com',
        type: 'signup',
        options: { emailRedirectTo: 'https://example.com/confirm' },
      })
    })

    it('returns Ok on success', async () => {
      client.auth.resend.mockResolvedValue(successResponse)

      const result = await commands.resendRegisterConfirmation({
        email: 'user@example.com',
        redirectTo: 'https://example.com/confirm',
      })

      expect(resultIsSuccess(result)).toBe(true)
    })

    it('returns Err with the mapped error message on failure', async () => {
      client.auth.resend.mockResolvedValue(errorResponse('Too many requests'))

      const result = await commands.resendRegisterConfirmation({
        email: 'user@example.com',
        redirectTo: 'https://example.com/confirm',
      })

      expect(resultIsError(result)).toBe(true)
      if (resultIsError(result)) {
        expect(result.error.message).toBe('Too many requests')
      }
    })
  })

  describe('updatePassword', () => {
    it('calls updateUser with the provided password', async () => {
      client.auth.updateUser.mockResolvedValue(successResponse)

      await commands.updatePassword({ password: 'newpassword' })

      expect(client.auth.updateUser).toHaveBeenCalledOnce()
      expect(client.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword',
      })
    })

    it('returns Ok on success', async () => {
      client.auth.updateUser.mockResolvedValue(successResponse)

      const result = await commands.updatePassword({ password: 'newpassword' })

      expect(resultIsSuccess(result)).toBe(true)
    })

    it('returns Err with the mapped error message on failure', async () => {
      client.auth.updateUser.mockResolvedValue(
        errorResponse('New password should be different from the old password'),
      )

      const result = await commands.updatePassword({ password: 'samepassword' })

      expect(resultIsError(result)).toBe(true)
      if (resultIsError(result)) {
        expect(result.error.message).toBe(
          'New password should be different from the old password',
        )
      }
    })
  })
})
