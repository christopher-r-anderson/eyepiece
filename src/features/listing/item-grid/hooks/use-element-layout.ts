import { RefObject, useEffect, useLayoutEffect, useState } from 'react'

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
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(() => {
      if (element.offsetWidth > 0) {
        setLayout({ offsetTop: element.offsetTop, width: element.offsetWidth })
      }
    })

    observer.observe(element)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [ref])

  return layout
}
