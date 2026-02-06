import { useEffect, useRef } from 'react'

export function useEvent<T extends (...args: Array<any>) => void>(handler?: T) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  }, [handler])
  return ref
}
