import { describe, expect, it } from 'vitest'
import {
  getSessionReadReasons,
  markSessionRead,
  runWithSessionReadTracking,
  wasSessionRead,
} from './session-read-sentinel'

describe('session-read-sentinel', () => {
  it('records reads made inside a tracked scope', () => {
    runWithSessionReadTracking(() => {
      expect(wasSessionRead()).toBe(false)

      markSessionRead('createUserSupabaseServerClient')

      expect(wasSessionRead()).toBe(true)
      expect(getSessionReadReasons()).toEqual([
        'createUserSupabaseServerClient',
      ])
    })
  })

  it('records reads across async continuations', async () => {
    await runWithSessionReadTracking(async () => {
      await Promise.resolve()
      markSessionRead('after-await')
      await Promise.resolve()

      expect(wasSessionRead()).toBe(true)
    })
  })

  it('ignores reads outside a tracked scope', () => {
    markSessionRead('untracked')

    expect(wasSessionRead()).toBe(false)
    expect(getSessionReadReasons()).toEqual([])
  })

  it('isolates concurrent tracked scopes', async () => {
    await Promise.all([
      runWithSessionReadTracking(async () => {
        markSessionRead('scope-a')
        await Promise.resolve()
        expect(getSessionReadReasons()).toEqual(['scope-a'])
      }),
      runWithSessionReadTracking(async () => {
        await Promise.resolve()
        expect(getSessionReadReasons()).toEqual([])
      }),
    ])
  })
})
