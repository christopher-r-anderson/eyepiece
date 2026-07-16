import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { link } from 'styled-system/recipes'
import type { LinkProps } from 'react-aria-components'
import type { SystemStyleObject } from 'styled-system/types'

// unlike StyleProps, className is accepted here: the router's createLink
// injects one on active links ('active' by default) and it must merge
// with our classes, not replace them. style active states through
// [aria-current=page], which the router also sets
type AppLinkProps = LinkProps & {
  css?: SystemStyleObject
  className?: string
}

function AppLink({ css: cssProp, className, ...props }: AppLinkProps) {
  return (
    <ReactAriaLink {...props} className={cx(link(), css(cssProp), className)} />
  )
}

export const Link = createLink(AppLink)
