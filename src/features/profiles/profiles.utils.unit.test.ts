import { describe, expect, it } from 'vitest'
import {
  profileInputToUpsertProfile,
  profileRowToProfileDisplay,
} from './profiles.utils'

describe('profileInputToUpsertProfile', () => {
  it('maps id and displayName to the database column names', () => {
    const input = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      displayName: 'Ada Lovelace',
    }
    const result = profileInputToUpsertProfile(input)
    expect(result).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440001',
      display_name: 'Ada Lovelace',
    })
  })
})

describe('profileRowToProfileDisplay', () => {
  it('maps id and display_name to the display shape', () => {
    const row = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      display_name: 'Grace Hopper',
    }
    const result = profileRowToProfileDisplay(row)
    expect(result).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440001',
      displayName: 'Grace Hopper',
    })
  })
})
