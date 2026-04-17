import type { ComponentPropsWithoutRef } from 'react'

export function Footer(props: ComponentPropsWithoutRef<'footer'>) {
  return (
    <footer
      className={props.className}
      css={{
        padding: 'var(--space-4)',
      }}
      {...props}
    >
      <p>&copy; 2025 Christopher Anderson</p>
    </footer>
  )
}
