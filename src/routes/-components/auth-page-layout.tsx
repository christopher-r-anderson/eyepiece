import { Outlet } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'

export function AuthPageLayout() {
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
        className={grid({
          gap: '4',
          width: '100%',
          maxWidth: 'formMax',
          margin: '0 auto',
          backgroundColor: 'bg.surface.3',
          border: 'default',
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
