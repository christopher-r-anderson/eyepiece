import { useEffect, useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

// avoid potential `useLayoutEffect`s are noops warnings during SSR - we want a noop
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function useElementLayout<T extends HTMLElement>(
  ref: RefObject<T | null>,
) {
  const [layout, setLayout] = useState<{
    offsetTop: number
    width: number
  } | null>(null)

  useIsomorphicLayoutEffect(() => {
    // the ref moves between elements when the grid swaps its
    // static/virtualized implementation, so every callback re-reads it and
    // re-observes; observing document.body catches the swap itself, since a
    // disconnected element no longer reports resizes
    let observedElement: HTMLElement | null = null

    const observer = new ResizeObserver(() => {
      const element = ref.current
      if (!element) return
      if (element !== observedElement) {
        if (observedElement) observer.unobserve(observedElement)
        observedElement = element
        observer.observe(element)
      }
      if (element.offsetWidth > 0) {
        setLayout({ offsetTop: element.offsetTop, width: element.offsetWidth })
      }
    })

    observer.observe(document.body)
    if (ref.current) {
      observedElement = ref.current
      observer.observe(ref.current)
    }
    return () => observer.disconnect()
  }, [ref])

  return layout
}
