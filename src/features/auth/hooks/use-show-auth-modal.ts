import { useNavigate, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import { stripAuthSearchParams } from '@/features/auth/auth.utils'

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
      // the first open pushes one entry (marked so closing can go back);
      // switching tabs while open replaces, so the whole dialog visit
      // occupies a single history entry
      const alreadyOpen =
        (router.state.location.search as { auth?: unknown }).auth != null
      navigate({
        to: '.',
        search: (prev) => createAuthModalSearch(prev, auth),
        viewTransition: false,
        replace: alreadyOpen,
        state: (prev) => (alreadyOpen ? prev : { ...prev, dialogPushed: true }),
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
