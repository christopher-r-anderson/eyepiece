import { css } from 'styled-system/css'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { PrettyException } from '@/components/ui/error'
import { useCaptureRouteError } from '@/app/layout/route-error'

export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  useCaptureRouteError(error, {
    boundaryKind: 'root-route',
    feature: 'app',
    operation: 'render_root_route',
  })

  return (
    <div>
      {/* styled in place: preflight strips heading and button defaults, and
          the boundary stays off the ui component layer */}
      <h1
        className={css({
          fontSize: '2xl',
          fontWeight: 700,
          lineHeight: 'tight',
          marginBlockEnd: '5',
        })}
      >
        Something went wrong
      </h1>

      <PrettyException error={error} headingLevel={2} />

      <button
        onClick={reset}
        className={css({
          marginBlockStart: '4',
          paddingBlock: '2',
          paddingInline: '4',
          border: 'default',
          borderRadius: 'md',
          backgroundColor: 'secondary.bg',
          color: 'secondary.text',
          cursor: 'pointer',
        })}
      >
        Try again
      </button>
    </div>
  )
}
