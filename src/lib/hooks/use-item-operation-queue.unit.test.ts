import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useItemOperationQueue } from './use-item-operation-queue'

describe('useItemOperationQueue', () => {
  it('serializes operations per item', async () => {
    const { result } = renderHook(() => useItemOperationQueue())
    const order: Array<string> = []
    let releaseFirst = () => {}
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    result.current.enqueue('a', async () => {
      await gate
      order.push('first')
    })
    result.current.enqueue('a', () => {
      order.push('second')
      return Promise.resolve()
    })
    expect(order).toEqual([])
    releaseFirst()
    await waitFor(() => expect(order).toEqual(['first', 'second']))
  })

  it('drops settled entries so intent counters reset per item', async () => {
    const { result } = renderHook(() => useItemOperationQueue())
    expect(result.current.nextIntent('a')).toBe(1)
    result.current.enqueue('a', () => Promise.resolve())
    // without settled-entry cleanup the counter would advance to 2
    await waitFor(() => expect(result.current.nextIntent('a')).toBe(1))
  })

  it('rollback guards see only the latest intent', () => {
    const { result } = renderHook(() => useItemOperationQueue())
    const first = result.current.nextIntent('a')
    const second = result.current.nextIntent('a')
    expect(result.current.isCurrentIntent('a', first)).toBe(false)
    expect(result.current.isCurrentIntent('a', second)).toBe(true)
  })
})
