import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { link } from 'styled-system/recipes'
import type { LinkProps } from 'react-aria-components'
import type { StyleProps } from './style-props'

type AppLinkProps = LinkProps & StyleProps

function AppLink({ css: cssProp, className, ...props }: AppLinkProps) {
  return (
    <ReactAriaLink
      className={cx(link(), css(cssProp), className)}
      {...props}
    />
  )
}

export const Link = createLink(AppLink)
