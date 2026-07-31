import { useCallback, useRef, useState } from 'react'
import { css } from 'styled-system/css'
import { Button } from '@/components/ui/button'
import { useItemOperationQueue } from '@/lib/hooks/use-item-operation-queue'

// The dim-ghost removal idiom: a removed tile keeps its slot dimmed with an
// always-visible veil so justified rows never re-break and undo stays in
// place. Ghosts are page-local view state - they clear on the next visit.
export const ghostTileCss = css({
  '& [data-tile-primary-link]': { pointerEvents: 'none' },
  '& img': { opacity: 0.3 },
  '& [data-tile-reveal], & [data-tile-controls]': {
    opacity: 1,
    translate: 'none',
  },
  // the veil only enables its controls while hover-revealed; a ghost's undo
  // must stay clickable without hover (coarse pointers, keyboard-then-mouse)
  '& [data-tile-controls]': { pointerEvents: 'auto' },
})

// the removal/restore swap unmounts the control being pressed and focus
// falls to body; call in the press handler to keep it on the control that
// takes the slot (or the row when nothing does)
export function refocusTileControlAfterSwap(assetKeyString: string) {
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) {
    return
  }
  const row = active.closest<HTMLElement>(
    `[role="row"][data-key="${CSS.escape(assetKeyString)}"]`,
  )
  if (!row) {
    return
  }
  requestAnimationFrame(() => {
    // only reclaim focus if the swap dropped it to the body; if it has
    // moved to a real target since (e.g. a modal), leave it
    const current = document.activeElement
    if (current && current !== document.body && !row.contains(current)) {
      return
    }
    const control = row.querySelector<HTMLElement>(
      '[data-tile-controls] button:not([disabled])',
    )
    ;(control ?? row).focus()
  })
}

export function GhostRemovedActions({ onUndo }: { onUndo: () => void }) {
  return (
    <span
      className={css({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2',
      })}
    >
      Removed
      <Button
        variant="text"
        // the veil scrim owns its color pairs, so the prose voice keeps the
        // surrounding color instead of the text token
        css={css.raw({
          fontSize: '1em',
          color: 'inherit',
          _hovered: { color: 'inherit' },
        })}
        onPress={onUndo}
      >
        Undo
      </Button>
    </span>
  )
}

// Owns the ghost state machine over the per-item operation queue: optimistic
// Set flips, and rollback to the last state the server CONFIRMED - a failed
// operation's predecessor in the queue may itself have failed, so blindly
// inverting could ghost an item that was never removed (or the reverse).
// Failure callbacks only fire for the item's latest intent.
export function useGhostRemovals() {
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const { enqueue, nextIntent, isCurrentIntent } = useItemOperationQueue()
  const confirmedRemovedRef = useRef(new Set<string>())

  const rollBackToConfirmed = useCallback((id: string) => {
    setRemovedIds((prev) => {
      const shouldBeRemoved = confirmedRemovedRef.current.has(id)
      if (shouldBeRemoved === prev.has(id)) {
        return prev
      }
      const next = new Set(prev)
      if (shouldBeRemoved) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const run = useCallback(
    (
      id: string,
      removing: boolean,
      operation: () => Promise<unknown>,
      onFailure: (error: unknown) => void,
    ) => {
      setRemovedIds((prev) => {
        const next = new Set(prev)
        if (removing) {
          next.add(id)
        } else {
          next.delete(id)
        }
        return next
      })
      const token = nextIntent(id)
      enqueue(id, () =>
        operation().then(
          () => {
            if (removing) {
              confirmedRemovedRef.current.add(id)
            } else {
              confirmedRemovedRef.current.delete(id)
            }
          },
          (error: unknown) => {
            if (!isCurrentIntent(id, token)) {
              return
            }
            rollBackToConfirmed(id)
            onFailure(error)
          },
        ),
      )
    },
    [enqueue, nextIntent, isCurrentIntent, rollBackToConfirmed],
  )

  const runRemoval = useCallback(
    (
      id: string,
      operation: () => Promise<unknown>,
      onFailure: (error: unknown) => void,
    ) => run(id, true, operation, onFailure),
    [run],
  )

  const runRestore = useCallback(
    (
      id: string,
      operation: () => Promise<unknown>,
      onFailure: (error: unknown) => void,
    ) => run(id, false, operation, onFailure),
    [run],
  )

  const tileClassName = useCallback(
    (item: { id: string }) =>
      removedIds.has(item.id) ? ghostTileCss : undefined,
    [removedIds],
  )

  const tileLinkDisabled = useCallback(
    (item: { id: string }) => removedIds.has(item.id),
    [removedIds],
  )

  return {
    removedIds,
    runRemoval,
    runRestore,
    tileClassName,
    tileLinkDisabled,
  }
}
