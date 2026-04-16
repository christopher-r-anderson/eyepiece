import type { Profile } from '@/domain/profile/profile.schema'

export function Profile({ profile }: { profile: Profile }) {
  return (
    <section
      css={{
        width: '100%',
        maxWidth: '40rem',
        display: 'grid',
        gap: 'var(--space-3)',
        padding: 'var(--space-5)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--secondary-bg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h2>{profile.displayName}</h2>
      <p>Location: Milky Way</p>
    </section>
  )
}
