import { useCallback, useRef } from 'react'

// Serialized mutations for optimistic per-item UI (removal ghosts):
// - operations for one item run strictly in order, so a quick undo can't
//   race its removal's in-flight request (or vice versa)
// - each operation gets an intent token; rollback UI should apply only
//   when the failed operation is still the item's latest intent
export function useItemOperationQueue() {
  const pendingRef = useRef(new Map<string, Promise<void>>())
  const intentRef = useRef(new Map<string, number>())

  const nextIntent = useCallback((id: string) => {
    const token = (intentRef.current.get(id) ?? 0) + 1
    intentRef.current.set(id, token)
    return token
  }, [])

  const isCurrentIntent = useCallback(
    (id: string, token: number) => intentRef.current.get(id) === token,
    [],
  )

  const enqueue = useCallback((id: string, operation: () => Promise<void>) => {
    const prior = pendingRef.current.get(id) ?? Promise.resolve()
    // operations handle their own failures, so the chain never rejects
    const next = prior.then(operation)
    pendingRef.current.set(id, next)
  }, [])

  return { enqueue, nextIntent, isCurrentIntent }
}
