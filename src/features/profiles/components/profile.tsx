import { css } from 'styled-system/css'
import type { Profile } from '@/domain/profile/profile.schema'

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
      <h2>{profile.displayName}</h2>
      <p>Location: Milky Way</p>
    </section>
  )
}
