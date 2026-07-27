import { useEffect } from 'react'

const MODAL_OPEN_ATTRIBUTE = 'data-modal-open'

let openModalCount = 0

function syncModalOpenAttribute() {
  if (typeof document === 'undefined') {
    return
  }

  if (openModalCount > 0) {
    document.documentElement.setAttribute(MODAL_OPEN_ATTRIBUTE, 'true')
  } else {
    document.documentElement.removeAttribute(MODAL_OPEN_ATTRIBUTE)
  }
}

// the scrollbar-gutter override in the global css keys off this attribute;
// a count supports stacked overlays
export function useModalOpenAttribute(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    openModalCount += 1
    syncModalOpenAttribute()

    return () => {
      openModalCount = Math.max(0, openModalCount - 1)
      syncModalOpenAttribute()
    }
  }, [isOpen])
}
