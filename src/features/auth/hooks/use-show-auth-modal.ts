import { useNavigate } from '@tanstack/react-router'
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
  return useCallback(
    (auth: 'login' | 'register') => {
      navigate({
        to: '.',
        search: (prev) => createAuthModalSearch(prev, auth),
        viewTransition: false,
      })
    },
    [navigate],
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
