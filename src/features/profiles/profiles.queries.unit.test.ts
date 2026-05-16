import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getEnsureProfileByIdOptions,
  useEnsureProfile,
} from './profiles.queries'
import { useProfilesRepo } from './profiles.repo'

vi.mock('./profiles.repo')
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
    useQueryClient: vi.fn(),
  }
})

describe('getEnsureProfileByIdOptions', () => {
  it('uses me-scoped ensure query key shape for a known user id', () => {
    const options = getEnsureProfileByIdOptions({
      userId: 'user-id',
      repo: { getProfile: vi.fn() },
    })

    expect(options.queryKey).toEqual(['me', 'profile', 'ensure', 'user-id'])
  })

  it('uses me-scoped ensure query key shape for anonymous state', () => {
    const options = getEnsureProfileByIdOptions({
      userId: null,
      repo: { getProfile: vi.fn() },
    })

    expect(options.queryKey).toEqual(['me', 'profile', 'ensure', null])
  })
})

describe('useEnsureProfile cache sync', () => {
  const mockQueryClient = {
    setQueryData: vi.fn(),
    removeQueries: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useProfilesRepo).mockReturnValue({ getProfile: vi.fn() } as any)
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any)
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isSuccess: false,
    } as any)
  })

  it('writes canonical profile cache when ensure succeeds with profile data', () => {
    const profile = { id: 'user-id', displayName: 'Test User' }
    vi.mocked(useQuery).mockReturnValue({
      data: profile,
      isSuccess: true,
    } as any)

    renderHook(() => useEnsureProfile({ userId: 'user-id', enabled: true }))

    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ['profiles', 'detail', 'user-id'],
      profile,
    )
    expect(mockQueryClient.removeQueries).not.toHaveBeenCalled()
  })

  it('clears canonical profile cache when ensure succeeds with null', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isSuccess: true,
    } as any)

    renderHook(() => useEnsureProfile({ userId: 'user-id', enabled: true }))

    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ['profiles', 'detail', 'user-id'],
      exact: true,
    })
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
  })

  it('does not sync canonical profile cache when ensure is not successful', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { id: 'user-id', displayName: 'Test User' },
      isSuccess: false,
    } as any)

    renderHook(() => useEnsureProfile({ userId: 'user-id', enabled: true }))

    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
    expect(mockQueryClient.removeQueries).not.toHaveBeenCalled()
  })
})
