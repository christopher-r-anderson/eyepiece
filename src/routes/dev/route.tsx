import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'

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
      css={{
        width: '100%',
        flex: 1,
        maxWidth: 'var(--size-content-max)',
        margin: '0 auto',
        paddingInline: 'var(--space-content-inline)',
        paddingBlock: 'var(--space-content-block)',
        display: 'grid',
        alignContent: 'start',
        gap: 'var(--space-section-gap)',
      }}
    >
      <Outlet />
    </div>
  )
}
