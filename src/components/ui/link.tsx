import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import type { LinkProps } from 'react-aria-components'

const linkStyles = {
  color: 'var(--link-color)',
  textDecoration: 'none',
  '&[data-hovered]': { textDecoration: 'underline' },
}

function AppLink(props: LinkProps) {
  return <ReactAriaLink css={linkStyles} {...props} />
}

export const Link = createLink(AppLink)
