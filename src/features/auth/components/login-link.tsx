import { useLocation, useNavigate } from '@tanstack/react-router'
import { isPlainLeftClick, stripAuthSearchParams } from '../util'
import { useAuthInteractionStrategy } from '../hooks/use-auth-interaction-strategy'
import { Link } from '@/components/ui/link'
import { urlToNextParam } from '@/lib/util'

export function LoginLink() {
  const href = useLocation({ select: (location) => location.href })
  const navigate = useNavigate()
  const isModalStrategy = useAuthInteractionStrategy() === 'modal'
  return (
    <Link
      to="/login"
      search={{ next: isModalStrategy ? urlToNextParam(href) : undefined }}
      onClick={(event) => {
        if (isModalStrategy && isPlainLeftClick(event)) {
          event.preventDefault()
          navigate({
            to: '.',
            search: (prev) => ({
              ...stripAuthSearchParams(prev),
              auth: 'login',
            }),
          })
        }
      }}
      viewTransition={false}
    >
      Log In
    </Link>
  )
}
