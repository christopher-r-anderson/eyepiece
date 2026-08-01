import { useNavigate, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import { preservedMaskOptions } from '../auth.utils'

export function useShowAuthModal() {
  const navigate = useNavigate()
  const router = useRouter()
  return useCallback(
    (auth: 'login' | 'register') => {
      // tab switches while open replace, so a dialog visit stays one entry
      const alreadyOpen = router.state.location.state.authModal != null
      navigate({
        to: '.',
        search: (prev: unknown) => prev as never,
        replace: alreadyOpen,
        resetScroll: false,
        state: (prev) => ({
          ...prev,
          authModal: auth,
          authForgotPassword: undefined,
          dialogPushed: alreadyOpen ? prev.dialogPushed : true,
        }),
        ...preservedMaskOptions(router.state.location),
      })
    },
    [navigate, router],
  )
}

export function useSetAuthForgotPassword() {
  const navigate = useNavigate()
  const router = useRouter()
  return useCallback(
    (showForgotPassword: boolean) => {
      navigate({
        to: '.',
        search: (prev: unknown) => prev as never,
        replace: true,
        resetScroll: false,
        state: (prev) => ({
          ...prev,
          authForgotPassword: showForgotPassword ? true : undefined,
        }),
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
