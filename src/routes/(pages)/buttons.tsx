import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/(pages)/buttons')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div
      css={{
        width: '100%',
        maxWidth: '40rem',
        display: 'grid',
        gap: 'var(--space-4)',
      }}
    >
      <h1>Buttons</h1>
      <p>This page is for testing button styles.</p>
      <p>
        <Button>Secondary Button</Button>
      </p>
      <p>
        <Button icon={MagnifyingGlassIcon}>Secondary Button</Button>
      </p>
      <p>
        <Button
          css={{ width: 'min(100%, 37.5rem)' }}
          icon={MagnifyingGlassIcon}
        >
          Secondary Button
        </Button>
      </p>
      <p>
        <Button
          css={{ width: 'min(100%, 37.5rem)' }}
          icon={MagnifyingGlassIcon}
        >
          <span css={{ flex: 1, minWidth: 0 }}>Secondary Button</span>
        </Button>
      </p>
      <p>
        <Button css={{ width: 'min(100%, 37.5rem)' }}>
          {() => (
            <>
              <span css={{ flex: 1, minWidth: 0 }}>Secondary Button</span>
              <MagnifyingGlassIcon />
            </>
          )}
        </Button>
      </p>
      <p>
        <Button variant="primary">Primary Button</Button>
      </p>
      <p>
        <Button variant="primary" icon={MagnifyingGlassIcon}>
          Primary Button
        </Button>
      </p>
    </div>
  )
}
