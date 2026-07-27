import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { link } from 'styled-system/recipes'
import type { LinkProps } from 'react-aria-components'
import type { LinkVariantProps } from 'styled-system/recipes'
import type { UiProps } from './style-contract'

// hand-written rather than uiStyled: createLink's generic inference needs a
// concrete function component, and this keeps the string-only className of
// the ui contract (the router injects one on active links, which must merge)
function AppLink({
  css: cssProp,
  className,
  variant,
  underline,
  omitActiveProps,
  ...props
}: UiProps<LinkProps> & LinkVariantProps & { omitActiveProps?: boolean }) {
  if (omitActiveProps) {
    // a masked link's real destination is the current route, but its href
    // points elsewhere - announcing it as the current page would be wrong
    delete (props as Record<string, unknown>)['aria-current']
    delete (props as Record<string, unknown>)['data-status']
  }
  return (
    <ReactAriaLink
      {...props}
      className={cx(link({ variant, underline }), css(cssProp), className)}
    />
  )
}

export const Link = createLink(AppLink)
