import type { ComponentPropsWithoutRef } from 'react'

export function Footer(props: ComponentPropsWithoutRef<'footer'>) {
  return (
    <footer className={props.className} {...props}>
      <p>&copy; 2025 Christopher Anderson</p>
    </footer>
  )
}
