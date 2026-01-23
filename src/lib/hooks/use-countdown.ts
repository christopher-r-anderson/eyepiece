import { useCallback, useEffect, useRef, useState } from 'react'

type UseCountdownOptions = {
  autoStart?: boolean
  onComplete?: () => void
}

type UseCountdownActions = {
  isRunning: boolean
  start: () => void
  stop: () => void
}

export function useCountdown(
  initialSeconds: number,
  options: UseCountdownOptions = {},
): [number, UseCountdownActions] {
  const { autoStart = true, onComplete } = options
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const hasCompletedRef = useRef(false)

  useEffect(() => {
    hasCompletedRef.current = false
    setSeconds(initialSeconds)
    setIsRunning(autoStart)
  }, [initialSeconds, autoStart])

  useEffect(() => {
    if (!isRunning) {
      return
    }

    if (seconds <= 0) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        setIsRunning(false)
        onComplete?.()
      }
      return
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, seconds, onComplete])

  const start = useCallback(() => {
    hasCompletedRef.current = false
    setSeconds(initialSeconds)
    setIsRunning(true)
  }, [initialSeconds])

  const stop = useCallback(() => {
    setIsRunning(false)
  }, [])

  return [seconds, { isRunning, start, stop }]
}
