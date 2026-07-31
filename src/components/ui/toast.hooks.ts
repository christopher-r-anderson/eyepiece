import { UNSTABLE_ToastQueue as ToastQueue } from 'react-aria-components'
import { useCallback } from 'react'
import type { ToastContent } from './toast'

export const toastQueue = new ToastQueue<ToastContent>()

export const useQueueToastMessage = () => {
  return useCallback((content: ToastContent) => {
    toastQueue.add(content)
  }, [])
}
