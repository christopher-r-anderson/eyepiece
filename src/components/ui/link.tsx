import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { LinkProps } from 'react-aria-components'
import type { SystemStyleObject } from 'styled-system/types'

const linkStyles = css.raw({
  color: 'link',
  textDecoration: 'none',
  transitionProperty: 'color',
  transitionDuration: 'fast',
  transitionTimingFunction: 'default',
  _hovered: { textDecoration: 'underline' },
  _focusVisible: {
    outline: '1px solid token(colors.outline)',
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
