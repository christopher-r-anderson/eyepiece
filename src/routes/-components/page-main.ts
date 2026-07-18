import { css } from 'styled-system/css'

// the shared top-level <main> treatment for (public) and (private) pages
export const pageMainCss = css.raw({
  width: '100%',
  maxWidth: 'contentMax',
  flexGrow: 1,
  margin: '0 auto',
  paddingTop: '4',
  paddingInline: '4',
  paddingBottom: '7',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: '6',
})
