import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import { styled } from 'styled-system/jsx'
import { link } from 'styled-system/recipes'

export const Link = createLink(styled(ReactAriaLink, link))
