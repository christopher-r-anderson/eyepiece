import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import { grid } from 'styled-system/patterns'

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
      className={grid({
        width: 'full',
        flex: '1',
        maxWidth: 'contentMax',
        margin: '[0 auto]',
        paddingInline: 'contentInline',
        paddingBlock: 'contentBlock',
        alignContent: 'start',
        gap: 'sectionGap',
      })}
    >
      <Outlet />
    </div>
  )
}
