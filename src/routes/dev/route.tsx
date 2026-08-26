import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import { grid } from 'styled-system/patterns'
import { MAIN_CONTENT_ID } from '@/components/page-main'

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
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
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
    </main>
  )
}
