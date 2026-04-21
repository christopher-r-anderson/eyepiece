import { notFound, redirect } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { logErrorWithObservability } from './error-logging'

describe('logErrorWithObservability', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs operational errors with console.error', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const error = new Error('boom')

    logErrorWithObservability('Unexpected failure', error, {
      feature: 'favorites',
    })

    expect(consoleError).toHaveBeenCalledWith('Unexpected failure', {
      feature: 'favorites',
      error,
      observability: {
        kind: 'operational',
        level: 'error',
        shouldReport: true,
      },
    })
  })

  it('logs handled 4xx responses with console.warn', () => {
    const consoleWarn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
    const response = new Response(null, { status: 400 })

    logErrorWithObservability('Handled validation failure', response)

    expect(consoleWarn).toHaveBeenCalledWith('Handled validation failure', {
      error: response,
      observability: {
        kind: 'expected',
        level: 'warning',
        shouldReport: false,
      },
    })
  })

  it('logs redirect-style expected control flow with console.info', () => {
    const consoleInfo = vi
      .spyOn(console, 'info')
      .mockImplementation(() => undefined)
    const error = redirect({ to: '/' })

    logErrorWithObservability('Redirected request', error)

    expect(consoleInfo).toHaveBeenCalledWith('Redirected request', {
      error,
      observability: {
        kind: 'expected',
        level: 'info',
        shouldReport: false,
      },
    })
  })

  it('logs notFound control flow with console.info', () => {
    const consoleInfo = vi
      .spyOn(console, 'info')
      .mockImplementation(() => undefined)
    const error = notFound()

    logErrorWithObservability('Missing route', error)

    expect(consoleInfo).toHaveBeenCalledWith('Missing route', {
      error,
      observability: {
        kind: 'expected',
        level: 'info',
        shouldReport: false,
      },
    })
  })
})
