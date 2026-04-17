import { describe, expect, it } from 'vitest'
import { notFound, redirect } from '@tanstack/react-router'
import { shouldCaptureRouteError } from './route-error'

describe('shouldCaptureRouteError', () => {
  it('does not capture TanStack redirect control flow', () => {
    expect(shouldCaptureRouteError(redirect({ to: '/' }))).toBe(false)
  })

  it('does not capture TanStack not found control flow', () => {
    expect(shouldCaptureRouteError(notFound())).toBe(false)
  })

  it('does not capture validation search errors from the router', () => {
    expect(
      shouldCaptureRouteError({
        routerCode: 'VALIDATE_SEARCH',
        message: 'Invalid search params',
      }),
    ).toBe(false)
  })

  it('does not capture handled 4xx responses', () => {
    expect(
      shouldCaptureRouteError(
        new Response(JSON.stringify({ error: 'bad request' }), { status: 400 }),
      ),
    ).toBe(false)
  })

  it('captures unexpected errors', () => {
    expect(shouldCaptureRouteError(new Error('boom'))).toBe(true)
  })
})
