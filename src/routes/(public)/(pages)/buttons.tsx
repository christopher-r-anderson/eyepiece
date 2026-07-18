import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/(public)/(pages)/buttons')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div
      className={grid({
        width: '100%',
        maxWidth: '40rem',
        gap: '4',
      })}
    >
      <Heading level={1} css={css.raw({ marginBlockEnd: 0 })}>
        Buttons
      </Heading>
      <p>This page is for testing button styles.</p>
      <p>
        <Button>Secondary Button</Button>
      </p>
      <p>
        <Button icon={MagnifyingGlassIcon}>Secondary Button</Button>
      </p>
      <p>
        <Button
          css={css.raw({ width: 'min(100%, 37.5rem)' })}
          icon={MagnifyingGlassIcon}
        >
          Secondary Button
        </Button>
      </p>
      <p>
        <Button
          css={css.raw({ width: 'min(100%, 37.5rem)' })}
          icon={MagnifyingGlassIcon}
        >
          <span className={css({ flex: 1, minWidth: 0 })}>
            Secondary Button
          </span>
        </Button>
      </p>
      <p>
        <Button css={css.raw({ width: 'min(100%, 37.5rem)' })}>
          {() => (
            <>
              <span className={css({ flex: 1, minWidth: 0 })}>
                Secondary Button
              </span>
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
      <p>
        <Button variant="ghost">Ghost Button</Button>
      </p>
      <p>
        <Button variant="bare" icon={MagnifyingGlassIcon}>
          Bare Button
        </Button>
      </p>
    </div>
  )
}
