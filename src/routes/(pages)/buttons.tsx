import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/(pages)/buttons')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h1>Buttons</h1>
      <p>This page is for testing button styles.</p>
      <p>
        <Button>Secondary Button</Button>
      </p>
      <p>
        <Button icon={MagnifyingGlassIcon}>Secondary Button</Button>
      </p>
      <p>
        <Button style={{ width: '600px' }} icon={MagnifyingGlassIcon}>
          Secondary Button
        </Button>
      </p>
      <p>
        <Button style={{ width: '600px' }} icon={MagnifyingGlassIcon}>
          <span style={{ flex: 1 }}>Secondary Button</span>
        </Button>
      </p>
      <p>
        <Button style={{ width: '600px' }}>
          {() => (
            <>
              <span style={{ flex: 1 }}>Secondary Button</span>
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
