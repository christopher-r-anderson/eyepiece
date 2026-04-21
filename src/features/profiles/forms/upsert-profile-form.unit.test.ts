import { createElement } from 'react'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INVALID_INPUT_ERROR } from '../profiles.utils'
import { UpsertProfileForm } from './upsert-profile-form'
import { Err } from '@/lib/result'

const mockUpsertProfile = vi.fn()

vi.mock('../profiles.commands', () => ({
  useProfilesCommands: () => ({
    upsertProfile: mockUpsertProfile,
  }),
}))

describe('UpsertProfileForm', () => {
  beforeEach(() => {
    mockUpsertProfile.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders handled profile field errors from the shared action boundary', async () => {
    const onSuccess = vi.fn()

    mockUpsertProfile.mockResolvedValue(
      Err({
        code: INVALID_INPUT_ERROR,
        message: 'Invalid input',
        fieldErrors: {
          displayName: 'Display name must not be empty.',
          staleField: 'This stale key should be filtered out.',
        },
      }),
    )

    render(
      createElement(UpsertProfileForm, {
        actionType: 'create',
        headingLevel: 2,
        initialData: {
          id: '550e8400-e29b-41d4-a716-446655440001',
        },
        onSuccess,
      }),
    )

    fireEvent.change(screen.getByLabelText('Display Name (shown publicly)'), {
      target: { value: 'Mae Jemison' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(mockUpsertProfile).toHaveBeenCalledWith({
        id: '550e8400-e29b-41d4-a716-446655440001',
        displayName: 'Mae Jemison',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Invalid input')).toBeTruthy()
      expect(screen.getByText('Display name must not be empty.')).toBeTruthy()
    })

    expect(
      screen.queryByText('This stale key should be filtered out.'),
    ).toBeNull()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
