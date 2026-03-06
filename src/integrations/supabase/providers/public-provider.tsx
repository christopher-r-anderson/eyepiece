import { createContext, useContext } from 'react'
import { createPublicSupabaseClient } from '../public'
import type { ReactNode } from 'react'
import type { SupabaseClient } from '../types'

type PublicSupabaseClientContextValue = {
  publicSupabaseClient: SupabaseClient
}

const PublicSupabaseClientContext =
  createContext<PublicSupabaseClientContextValue | null>(null)

export function getPublicSupabaseClientContext() {
  return {
    publicSupabaseClient: createPublicSupabaseClient(),
  }
}

export function PublicSupabaseClientProvider({
  children,
  publicSupabaseClient,
}: {
  children: ReactNode
  publicSupabaseClient: SupabaseClient
}) {
  return (
    <PublicSupabaseClientContext.Provider value={{ publicSupabaseClient }}>
      {children}
    </PublicSupabaseClientContext.Provider>
  )
}

export function usePublicSupabaseClient() {
  const context = useContext(PublicSupabaseClientContext)
  if (!context) {
    throw new Error(
      'usePublicSupabaseClient must be used within a PublicSupabaseClientProvider',
    )
  }
  return context.publicSupabaseClient
}
