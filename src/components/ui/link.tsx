import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { LinkProps } from 'react-aria-components'
import type { SystemStyleObject } from 'styled-system/types'

const linkStyles = css.raw({
  color: 'link',
  textDecoration: 'none',
  transitionFast: 'color',
  _hovered: { textDecoration: 'underline' },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '2px',
  },
})

type AppLinkProps = LinkProps & {
  css?: SystemStyleObject
  className?: string
}

function AppLink({ css: cssProp, className, ...props }: AppLinkProps) {
  return (
    <ReactAriaLink
      className={cx(css(linkStyles, cssProp), className)}
      {...props}
    />
  )
}

export const Link = createLink(AppLink)
