import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import { styled } from 'styled-system/jsx'
import { link } from 'styled-system/recipes'

// plain styled(), not uiStyled: createLink's generic inference needs the
// factory's call signature, so this is the one component keeping react
// aria's wider className type
export const Link = createLink(styled(ReactAriaLink, link))
