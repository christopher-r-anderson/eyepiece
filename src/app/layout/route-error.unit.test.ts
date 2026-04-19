import { describe, expect, it } from 'vitest'
import { notFound, redirect } from '@tanstack/react-router'
import {
  getRouteErrorSentryMetadata,
  shouldCaptureRouteError,
} from './route-error'

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

  it('does not capture transported handled errors with an appError payload', () => {
    expect(
      shouldCaptureRouteError(
        Object.assign(new Error('AUTH_REQUIRED'), {
          appError: {
            code: 'AUTH_REQUIRED',
            message: 'AUTH_REQUIRED',
          },
        }),
      ),
    ).toBe(false)
  })

  it('captures unexpected errors', () => {
    expect(shouldCaptureRouteError(new Error('boom'))).toBe(true)
  })
})

describe('getRouteErrorSentryMetadata', () => {
  it('adds low-noise tags and context for route boundaries', () => {
    expect(
      getRouteErrorSentryMetadata({
        pathname: '/assets/nasa_ivl/PIA12235',
        captureContext: {
          boundaryKind: 'route',
          feature: 'assets',
          providerId: 'nasa_ivl',
          operation: 'load_asset',
        },
      }),
    ).toEqual({
      tags: {
        boundary_kind: 'route',
        feature: 'assets',
        provider_id: 'nasa_ivl',
        operation: 'load_asset',
      },
      context: {
        routePath: '/assets/nasa_ivl/PIA12235',
        boundaryKind: 'route',
        feature: 'assets',
        providerId: 'nasa_ivl',
        operation: 'load_asset',
      },
    })
  })

  it('prefers an explicit route path override when one is provided', () => {
    expect(
      getRouteErrorSentryMetadata({
        pathname: '/search',
        captureContext: {
          boundaryKind: 'catch',
          feature: 'search',
          routePath: '/search?q=apollo',
        },
      }),
    ).toEqual({
      tags: {
        boundary_kind: 'catch',
        feature: 'search',
      },
      context: {
        routePath: '/search?q=apollo',
        boundaryKind: 'catch',
        feature: 'search',
      },
    })
  })
})
