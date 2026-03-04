import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { stripAuthSearchParams } from '@/features/auth/auth.utils'

export function useShowAuthModal() {
  const navigate = useNavigate()
  return useCallback(
    (auth: 'login' | 'register') => {
      navigate({
        to: '.',
        search: (prev) => ({
          ...stripAuthSearchParams(prev),
          auth: auth,
        }),
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
