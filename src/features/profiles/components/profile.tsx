import type { Profile } from '@/domain/profile/profile.schema'

export function Profile({ profile }: { profile: Profile }) {
  return (
    <div>
      <h2>{profile.displayName}</h2>
      <p>Location: Milky Way</p>
    </div>
  )
}
