import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseOrThrowBadRequest, parseOrThrowProviderId } from './utils'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { shouldReportError } from '@/lib/error-observability'

describe('parseOrThrowBadRequest', () => {
  it('returns parsed data when the input is valid', () => {
    const schema = z.object({ page: z.coerce.number().min(1) })

    const result = parseOrThrowBadRequest(schema, { page: '2' })

    expect(result).toEqual({ page: 2 })
  })

  it('throws a 400 Response and logs the validation error when input is invalid', async () => {
    const schema = z.object({ page: z.coerce.number().min(1) })

    let response: Response | undefined
    try {
      parseOrThrowBadRequest(schema, { page: '0' }, 'Bad pagination')
    } catch (error) {
      response = error as Response
    }

    expect(response?.status).toBe(400)

    const body = await response?.json()
    expect(body).toEqual({
      error: {
        code: 'INVALID_INPUT',
        message: 'Bad pagination',
        issues: [
          {
            code: 'too_small',
            message: 'Too small: expected number to be >=1',
            path: 'page',
          },
        ],
      },
    })
    expect(shouldReportError(response)).toBe(false)
  })
})

describe('parseOrThrowProviderId', () => {
  it('parses supported provider IDs', () => {
    const result = parseOrThrowProviderId(NASA_IVL_PROVIDER_ID)

    expect(result).toBe(NASA_IVL_PROVIDER_ID)
  })

  it('throws a 400 response with the provider-specific message for invalid IDs', async () => {
    let response: Response | undefined
    try {
      parseOrThrowProviderId('bad-provider')
    } catch (error) {
      response = error as Response
    }

    expect(response?.status).toBe(400)

    const body = await response?.json()
    expect(body).toEqual({
      error: {
        code: 'INVALID_PATH_PARAMS',
        message: 'Invalid providerId',
        issues: [
          {
            code: 'invalid_value',
            message: "Invalid providerId, received 'bad-provider'",
            path: 'providerId',
          },
        ],
      },
    })
  })
})
