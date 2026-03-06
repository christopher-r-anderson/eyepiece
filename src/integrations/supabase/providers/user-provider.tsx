import { createContext, useContext } from 'react'
import { createUserSupabaseClient } from '../user'
import type { ReactNode } from 'react'
import type { SupabaseClient } from '../types'

type UserSupabaseClientContextValue = {
  userSupabaseClient: SupabaseClient
}

const UserSupabaseClientContext =
  createContext<UserSupabaseClientContextValue | null>(null)

export function getUserSupabaseClientContext() {
  return {
    userSupabaseClient: createUserSupabaseClient(),
  }
}

export function UserSupabaseClientProvider({
  children,
  userSupabaseClient,
}: {
  children: ReactNode
  userSupabaseClient: SupabaseClient
}) {
  return (
    <UserSupabaseClientContext.Provider value={{ userSupabaseClient }}>
      {children}
    </UserSupabaseClientContext.Provider>
  )
}

export function useUserSupabaseClient() {
  const context = useContext(UserSupabaseClientContext)
  if (!context) {
    throw new Error(
      'useUserSupabaseClient must be used within a UserSupabaseClientProvider',
    )
  }
  return context.userSupabaseClient
}
