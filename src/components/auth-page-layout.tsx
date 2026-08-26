import { Outlet } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { panelSurfaceStyles } from '@/components/ui/surface.styles'
import { MAIN_CONTENT_ID } from '@/components/page-main'

export function AuthPageLayout() {
  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className={css({
        width: 'full',
        maxWidth: 'contentMax',
        flexGrow: 1,
        margin: '[0 auto]',
        paddingTop: '[clamp(token(spacing.6), 12vh, 10rem)]',
        paddingInline: '4',
        paddingBottom: '7',
      })}
    >
      <div
        className={cx(
          grid({
            gap: '4',
            width: 'full',
            maxWidth: 'formMax',
            margin: '[0 auto]',
          }),
          css(panelSurfaceStyles),
        )}
      >
        <Outlet />
      </div>
    </main>
  )
}
