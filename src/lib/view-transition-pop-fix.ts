// Ensures View Transition snapshots are taken only after the browser has had
// time to paint/commit a stable frame and avoid a white "old" page
export function installStartViewTransitionDelayFix() {
  if (typeof window === 'undefined') return

  const docAny = document as any
  const origSvt: undefined | ((cb: any) => any) =
    docAny.startViewTransition?.bind(document)

  if (!origSvt) return

  if ((window as any).__startViewTransitionDelayFix) return
  ;(window as any).__startViewTransitionDelayFix = true

  const raf = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })

  // Delay the call to startViewTransition (snapshot capture happens at call time)
  docAny.startViewTransition = (updateCallback: any) => {
    return (async () => {
      await raf()
      await raf()
      return origSvt(updateCallback)
    })()
  }
}
