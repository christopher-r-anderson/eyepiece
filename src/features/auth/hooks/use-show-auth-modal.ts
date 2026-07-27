import { useNavigate, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import { preservedMaskOptions, stripAuthSearchParams } from '../auth.utils'

function createAuthModalSearch<T extends Record<string, unknown>>(
  prev: T,
  auth: 'login' | 'register',
) {
  return {
    ...stripAuthSearchParams(prev),
    auth,
  }
}

export function useShowAuthModal() {
  const navigate = useNavigate()
  const router = useRouter()
  return useCallback(
    (auth: 'login' | 'register') => {
      // tab switches while open replace, so a dialog visit stays one entry
      const alreadyOpen =
        (router.state.location.search as { auth?: unknown }).auth != null
      navigate({
        to: '.',
        search: (prev) => createAuthModalSearch(prev, auth),
        replace: alreadyOpen,
        state: (prev) => (alreadyOpen ? prev : { ...prev, dialogPushed: true }),
        ...preservedMaskOptions(router.state.location),
      })
    },
    [navigate, router],
  )
}

export function useShowLoginModal() {
  const showAuthModal = useShowAuthModal()
  return useCallback(() => {
    showAuthModal('login')
  }, [showAuthModal])
}

export function useShowRegisterModal() {
  const showAuthModal = useShowAuthModal()
  return useCallback(() => {
    showAuthModal('register')
  }, [showAuthModal])
}
