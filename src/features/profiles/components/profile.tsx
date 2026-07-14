import { css } from 'styled-system/css'
import type { Profile } from '@/domain/profile/profile.schema'
import { Heading } from '@/components/ui/heading'

export function Profile({ profile }: { profile: Profile }) {
  return (
    <section
      className={css({
        width: '100%',
        maxWidth: '40rem',
        display: 'grid',
        gap: '3',
        padding: '5',
        border: 'default',
        borderRadius: 'lg',
        backgroundColor: 'secondary.bg',
        boxShadow: 'sm',
      })}
    >
      <Heading headingLevel={2} css={css.raw({ marginBlockEnd: 0 })}>
        {profile.displayName}
      </Heading>
      <p>Location: Milky Way</p>
    </section>
  )
}
