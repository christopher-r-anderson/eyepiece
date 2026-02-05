export type User = {
  id: string
  email?: string | null
  givenName?: string
  familyName?: string
}

export type AuthInteractionStrategy = 'modal' | 'page'
