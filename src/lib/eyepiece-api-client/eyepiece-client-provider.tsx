import { createContext, useContext } from 'react'
import { createEyepieceClient } from './client'
import type { EyepieceClient } from './client'
import type { ReactNode } from 'react'

type EyepieceClientContext = {
  eyepieceClient: EyepieceClient
}

const EyepieceClientContext = createContext<EyepieceClientContext | null>(null)

export function getEyepieceClientContext({
  origin,
}: {
  origin: string
}): EyepieceClientContext {
  return {
    eyepieceClient: createEyepieceClient({ origin }),
  }
}

export function EyepieceClientProvider({
  children,
  eyepieceClient,
}: {
  children: ReactNode
  eyepieceClient: EyepieceClient
}) {
  return (
    <EyepieceClientContext.Provider value={{ eyepieceClient }}>
      {children}
    </EyepieceClientContext.Provider>
  )
}

export function useEyepieceClient() {
  const context = useContext(EyepieceClientContext)
  if (!context)
    throw new Error(
      'useEyepieceClient must be used within a EyepieceClientProvider',
    )
  return context.eyepieceClient
}
