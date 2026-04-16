import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import type { LinkProps } from 'react-aria-components'
import type { Interpolation, Theme } from '@emotion/react'

const linkStyles = {
  color: 'var(--link-color)',
  textDecoration: 'none',
  transition: 'color var(--transition-fast)',
  '&[data-hovered]': { textDecoration: 'underline' },
  '&[data-focus-visible]': {
    outline: '1px solid var(--outline-color)',
    outlineOffset: '2px',
  },
}

type AppLinkProps = LinkProps & {
  css?: Interpolation<Theme>
}

function AppLink({ css: cssProp, ...props }: AppLinkProps) {
  return <ReactAriaLink css={[linkStyles, cssProp]} {...props} />
}

export const Link = createLink(AppLink)
