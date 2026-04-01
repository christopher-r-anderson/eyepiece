import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubFetchJsonOnce } from '../../test/utils/fetch-mock'
import { getContent, search } from './client'

const validAssetItem = {
  id: 'NASM-A123',
  title: 'Test Asset',
  unitCode: 'NASM',
  type: 'edanmdm',
  url: 'edanmdm:nasm_123',
  content: {
    descriptiveNonRepeating: {
      title: {
        label: 'Title',
        content: 'Test Asset',
      },
      record_ID: '123',
      unit_code: 'NASM',
      data_source: 'National Air and Space Museum',
      metadata_usage: {
        access: 'CC0',
      },
    },
  },
  hash: 'hash-123',
  docSignature: 'sig-123',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('si-oa client', () => {
  it('redacts api keys in error messages', async () => {
    const apiKey = 'super-secret-api-key'
    stubFetchJsonOnce({
      ok: false,
      statusText: 'Unauthorized',
      json: { message: 'Invalid key' },
    })

    let message = ''
    try {
      await search({ q: 'apollo' }, apiKey)
    } catch (error) {
      message = (error as Error).message
    }

    expect(message).toContain('api_key=REDACTED')
    expect(message).not.toContain(apiKey)
  })

  it('parses getContent responses into the expected schema', async () => {
    stubFetchJsonOnce({
      json: {
        status: 200,
        responseCode: 1,
        response: validAssetItem,
      },
    })

    const parsed = await getContent('NASM-A123', 'key')

    expect(parsed.response.id).toBe('NASM-A123')
    expect(parsed.response.title).toBe('Test Asset')
  })
})
