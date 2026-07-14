import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import { css } from 'styled-system/css'

export const Route = createFileRoute('/dev')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound()
    }
  },
  component: DevLayout,
})

function DevLayout() {
  return (
    <div
      className={css({
        width: '100%',
        flex: 1,
        maxWidth: 'contentMax',
        margin: '0 auto',
        paddingInline: 'contentInline',
        paddingBlock: 'contentBlock',
        display: 'grid',
        alignContent: 'start',
        gap: 'sectionGap',
      })}
    >
      <Outlet />
    </div>
  )
}
