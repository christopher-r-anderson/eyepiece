import { describe, expect, it } from 'vitest'
import { notFound, redirect } from '@tanstack/react-router'
import {
  expectedErrorObservability,
  getErrorObservability,
  getResultErrorObservability,
  operationalErrorObservability,
  shouldReportError,
} from './error-observability'

describe('expectedErrorObservability', () => {
  it('defaults expected handled errors to non-reporting warnings', () => {
    expect(expectedErrorObservability()).toEqual({
      kind: 'expected',
      level: 'warning',
      report: false,
    })
  })
})

describe('operationalErrorObservability', () => {
  it('defaults operational handled errors to reporting errors', () => {
    expect(operationalErrorObservability()).toEqual({
      kind: 'operational',
      level: 'error',
      report: true,
    })
  })
})

describe('getResultErrorObservability', () => {
  it('treats invalid input style codes as expected handled errors', () => {
    expect(
      getResultErrorObservability({
        code: 'INVALID_INPUT',
        message: 'Invalid input',
      }),
    ).toEqual({
      kind: 'expected',
      level: 'warning',
      shouldReport: false,
    })
  })

  it('treats explicit observability metadata as the source of truth', () => {
    expect(
      getResultErrorObservability({
        message: 'Try again later',
        observability: operationalErrorObservability({ level: 'warning' }),
      }),
    ).toEqual({
      kind: 'operational',
      level: 'warning',
      shouldReport: true,
    })
  })

  it('treats field-level validation errors as expected handled errors', () => {
    expect(
      getResultErrorObservability({
        message: 'Invalid profile',
        fieldErrors: { displayName: 'Required' },
      }),
    ).toEqual({
      kind: 'expected',
      level: 'warning',
      shouldReport: false,
    })
  })

  it('treats uncategorized errors as operational by default', () => {
    expect(
      getResultErrorObservability({ message: 'Database unavailable' }),
    ).toEqual({
      kind: 'operational',
      level: 'error',
      shouldReport: true,
    })
  })
})

describe('getErrorObservability', () => {
  it('does not report TanStack redirect control flow', () => {
    expect(getErrorObservability(redirect({ to: '/' }))).toEqual({
      kind: 'expected',
      level: 'info',
      shouldReport: false,
    })
  })

  it('does not report TanStack not found control flow', () => {
    expect(getErrorObservability(notFound())).toEqual({
      kind: 'expected',
      level: 'info',
      shouldReport: false,
    })
  })

  it('does not report router validation search errors', () => {
    expect(
      getErrorObservability({
        routerCode: 'VALIDATE_SEARCH',
        message: 'Invalid search params',
      }),
    ).toEqual({
      kind: 'expected',
      level: 'info',
      shouldReport: false,
    })
  })

  it('does not report handled 4xx responses', () => {
    expect(
      getErrorObservability(
        new Response(JSON.stringify({ error: 'bad request' }), {
          status: 400,
        }),
      ),
    ).toEqual({
      kind: 'expected',
      level: 'warning',
      shouldReport: false,
    })
  })

  it('reports 5xx responses and unexpected errors', () => {
    expect(getErrorObservability(new Response(null, { status: 500 }))).toEqual({
      kind: 'operational',
      level: 'error',
      shouldReport: true,
    })
    expect(getErrorObservability(new Error('boom'))).toEqual({
      kind: 'operational',
      level: 'error',
      shouldReport: true,
    })
  })

  it('does not report transported handled errors with appError payloads', () => {
    const transportedError = Object.assign(new Error('AUTH_REQUIRED'), {
      appError: {
        code: 'AUTH_REQUIRED',
        message: 'AUTH_REQUIRED',
      },
    })

    expect(getErrorObservability(transportedError)).toEqual({
      kind: 'expected',
      level: 'warning',
      shouldReport: false,
    })
  })
})

describe('shouldReportError', () => {
  it('returns the reporting flag from the shared policy', () => {
    expect(shouldReportError(new Response(null, { status: 400 }))).toBe(false)
    expect(shouldReportError(new Error('boom'))).toBe(true)
  })
})
