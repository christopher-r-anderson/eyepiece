export type User = {
  id: string
  email?: string | null
}

export type UserCacheKey = ['auth', 'user']

export type AuthInteractionStrategy = 'modal' | 'page'
