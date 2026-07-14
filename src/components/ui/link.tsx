import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { LinkProps } from 'react-aria-components'
import type { StyleProps } from './style-props'

type AppLinkProps = LinkProps & StyleProps

function AppLink({ css: cssProp, className, ...props }: AppLinkProps) {
  return (
    <ReactAriaLink
      className={cx(
        css(
          {
            color: 'link',
            textDecoration: 'none',
            transitionFast: 'color',
            _hovered: { textDecoration: 'underline' },
            _focusVisible: {
              outline: 'focusRing',
              outlineOffset: '2px',
            },
          },
          cssProp,
        ),
        className,
      )}
      {...props}
    />
  )
}

export const Link = createLink(AppLink)
