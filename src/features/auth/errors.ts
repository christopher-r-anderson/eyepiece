import type { ResultError } from '@/lib/result'

export function mapSupabaseAuthError(error: unknown): ResultError {
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: (error as { message: string }).message,
    }
  }
  return {
    message: 'An unknown error occurred',
  }
}
