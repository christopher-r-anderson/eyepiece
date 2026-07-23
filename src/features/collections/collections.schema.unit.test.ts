import { describe, expect, it } from 'vitest'
import { createCollectionInputSchema } from './collections.schema'

describe('createCollectionInputSchema', () => {
  it('defaults visibility to private when omitted', () => {
    const parsed = createCollectionInputSchema.parse({ name: 'Nebulae' })
    expect(parsed.visibility).toBe('private')
  })

  it('trims the name and keeps an explicit visibility', () => {
    const parsed = createCollectionInputSchema.parse({
      name: '  Apollo  ',
      visibility: 'public',
    })
    expect(parsed).toEqual({ name: 'Apollo', visibility: 'public' })
  })

  it('rejects an empty or whitespace-only name', () => {
    expect(() => createCollectionInputSchema.parse({ name: '   ' })).toThrow()
  })
})
