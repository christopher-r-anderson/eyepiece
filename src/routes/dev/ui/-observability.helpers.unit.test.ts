import { describe, expect, it } from 'vitest'
import {
  DEV_OBSERVABILITY_SERVER_ERROR_MESSAGE,
  DEV_OBSERVABILITY_VALIDATION_ERROR_BODY,
  createDevObservabilityValidationResponse,
  throwDevObservabilityServerError,
} from './-observability.helpers'

describe('observability.helpers', () => {
  it('throws the deterministic server error message', () => {
    expect(() => throwDevObservabilityServerError()).toThrow(
      DEV_OBSERVABILITY_SERVER_ERROR_MESSAGE,
    )
  })

  it('creates a handled validation response payload', async () => {
    const response = createDevObservabilityValidationResponse()

    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    await expect(response.json()).resolves.toEqual(
      DEV_OBSERVABILITY_VALIDATION_ERROR_BODY,
    )
  })
})
