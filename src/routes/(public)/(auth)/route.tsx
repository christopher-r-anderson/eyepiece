import { Outlet, createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { authPageSearchParamsSchema } from '@/features/auth/auth.schema'

export const Route = createFileRoute('/(public)/(auth)')({
  validateSearch: authPageSearchParamsSchema,
  component: PublicAuthLayout,
  staticData: { authInteractionStrategy: 'page' },
})

function PublicAuthLayout() {
  return (
    <main
      className={css({
        width: '100%',
        maxWidth: 'contentMax',
        flexGrow: 1,
        margin: '0 auto',
        paddingTop: 'clamp(token(spacing.6), 12vh, 10rem)',
        paddingInline: '4',
        paddingBottom: '7',
      })}
    >
      <div
        className={css({
          width: '100%',
          maxWidth: '32rem',
          margin: '0 auto',
          backgroundColor: 'tertiary.bg',
          border: '1px solid token(colors.border)',
          borderRadius: 'lg',
          boxShadow: 'sm',
          padding: '4',
        })}
      >
        <Outlet />
      </div>
    </main>
  )
}
