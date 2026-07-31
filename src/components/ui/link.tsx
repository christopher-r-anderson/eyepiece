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
  ...props
}: UiProps<LinkProps> & LinkVariantProps) {
  return (
    <ReactAriaLink
      {...props}
      className={cx(link({ variant }), css(cssProp), className)}
    />
  )
}

export const Link = createLink(AppLink)
