export type User = {
  id: string
  email?: string | null
}

export type AuthInteractionStrategy = 'modal' | 'page'
