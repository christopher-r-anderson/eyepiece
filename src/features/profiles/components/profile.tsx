import type { ProfileDisplay } from '@/lib/schemas/profile.schema'

export function Profile({ profile }: { profile: ProfileDisplay }) {
  return (
    <div>
      <h2>{profile.displayName}</h2>
      <p>Location: Milky Way</p>
    </div>
  )
}
