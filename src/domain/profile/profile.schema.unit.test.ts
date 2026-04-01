import { describe, expect, it } from 'vitest'
import { profileSchema } from './profile.schema'

describe('profileSchema', () => {
  it('parses a valid profile', () => {
    const profile = profileSchema.parse({
      id: '00000000-0000-4000-8000-000000000001',
      displayName: 'Hubble Fan',
    })

    expect(profile.displayName).toBe('Hubble Fan')
  })

  it('trims whitespace from displayName', () => {
    const profile = profileSchema.parse({
      id: '00000000-0000-4000-8000-000000000001',
      displayName: '  Galaxy Explorer  ',
    })

    expect(profile.displayName).toBe('Galaxy Explorer')
  })

  it('rejects a whitespace-only displayName', () => {
    expect(() =>
      profileSchema.parse({
        id: '00000000-0000-4000-8000-000000000001',
        displayName: '   ',
      }),
    ).toThrow()
  })

  it('accepts a displayName of exactly 60 characters', () => {
    const profile = profileSchema.parse({
      id: '00000000-0000-4000-8000-000000000001',
      displayName: 'a'.repeat(60),
    })

    expect(profile.displayName).toHaveLength(60)
  })

  it('rejects a displayName exceeding 60 characters', () => {
    expect(() =>
      profileSchema.parse({
        id: '00000000-0000-4000-8000-000000000001',
        displayName: 'a'.repeat(61),
      }),
    ).toThrow()
  })

  it('rejects an invalid uuid', () => {
    expect(() =>
      profileSchema.parse({
        id: 'not-a-uuid',
        displayName: 'Valid Name',
      }),
    ).toThrow()
  })
})
