import { useLocation } from '@tanstack/react-router'
import { isPlainLeftClick } from '../auth.utils'
import { useAuthInteractionStrategy } from '../hooks/use-auth-interaction-strategy'
import { useShowLoginModal } from '../hooks/use-show-auth-modal'
import { Link } from '@/components/ui/link'
import { urlToNextParam } from '@/lib/utils'

export function LoginLink() {
  const href = useLocation({ select: (location) => location.href })
  const showLoginModal = useShowLoginModal()
  const isModalStrategy = useAuthInteractionStrategy() === 'modal'
  return (
    <Link
      to="/login"
      css={{ fontWeight: 500, whiteSpace: 'nowrap' }}
      search={{ next: isModalStrategy ? urlToNextParam(href) : undefined }}
      onClick={(event) => {
        if (isModalStrategy && isPlainLeftClick(event)) {
          event.preventDefault()
          showLoginModal()
        }
      }}
      viewTransition={false}
    >
      Log In
    </Link>
  )
}
