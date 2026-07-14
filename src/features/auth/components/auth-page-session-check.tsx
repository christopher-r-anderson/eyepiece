import { css } from 'styled-system/css'
import { Heading } from '@/components/ui/heading'
import { formStatusPanelCss } from '@/components/ui/forms'

export function AuthPageSessionCheck({ heading }: { heading: string }) {
  return (
    <section className={css(formStatusPanelCss)} aria-busy="true">
      <Heading headingLevel={1}>{heading}</Heading>
      <p>Checking your session...</p>
    </section>
  )
}
